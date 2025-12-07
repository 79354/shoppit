# push notificaitons handlers
import requests
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def send_push_notification(user, title, body, data=None):
    """
    Send push notification using Firebase Cloud Messaging
    """
    if not hasattr(user, 'fcm_token') or not user.fcm_token:
        return False
    
    fcm_url = "https://fcm.googleapis.com/fcm/send"
    
    headers = {
        "Authorization": f"key={settings.FCM_SERVER_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "to": user.fcm_token,
        "notification": {
            "title": title,
            "body": body,
            "icon": "/icon.png",
            "click_action": "FLUTTER_NOTIFICATION_CLICK"
        },
        "data": data or {}
    }
    
    try:
        response = requests.post(fcm_url, json=payload, headers=headers)
        return response.status_code == 200
    except Exception as e:
        print(f"Push notification error: {e}")
        return False


def send_websocket_notification(user_id, notification_type, message, room_id=None):
    """
    Send real-time notification via WebSocket
    """
    channel_layer = get_channel_layer()
    notification_group = f'notifications_{user_id}'
    
    async_to_sync(channel_layer.group_send)(
        notification_group,
        {
            'type': 'notification',
            'notification_type': notification_type,
            'message': message,
            'room_id': room_id
        }
    )


def notify_new_support_request(room):
    """
    Notify all available support agents of new request
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    support_agents = User.objects.filter(is_staff=True, is_active=True)
    
    for agent in support_agents:
        # WebSocket notification
        send_websocket_notification(
            agent.id,
            'new_request',
            f'New support request from {room.customer.email}',
            room.room_id
        )
        
        # Push notification
        send_push_notification(
            agent,
            'New Support Request',
            f'Customer {room.customer.email} needs assistance',
            {'room_id': room.room_id, 'type': 'new_request'}
        )


def notify_new_message(room, sender):
    """
    Notify the other party about new message
    """
    recipient = room.support_agent if sender == room.customer else room.customer
    
    if not recipient:
        return
    
    # WebSocket notification
    send_websocket_notification(
        recipient.id,
        'message',
        f'New message from {sender.email}',
        room.room_id
    )
    
    # Push notification
    send_push_notification(
        recipient,
        f'Message from {sender.email}',
        'You have a new message in support chat',
        {'room_id': room.room_id, 'type': 'new_message'}
    )


def notify_agent_joined(room):
    """
    Notify customer that agent has joined
    """
    send_websocket_notification(
        room.customer.id,
        'agent_joined',
        f'Support agent {room.support_agent.username} has joined the chat',
        room.room_id
    )
    
    send_push_notification(
        room.customer,
        'Agent Connected',
        f'{room.support_agent.username} is now available to help',
        {'room_id': room.room_id, 'type': 'agent_joined'}
    )


def notify_room_closed(room):
    """
    Notify both parties that room is closed
    """
    for user in [room.customer, room.support_agent]:
        if user:
            send_websocket_notification(
                user.id,
                'room_closed',
                'Support conversation has been closed',
                room.room_id
            )
            
            send_push_notification(
                user,
                'Chat Closed',
                'Your support conversation has been resolved',
                {'room_id': room.room_id, 'type': 'room_closed'}
            )


# backend/support/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SupportRoom, ChatMessage
from .notifications import (
    notify_new_support_request,
    notify_new_message,
    notify_agent_joined,
    notify_room_closed
)


@receiver(post_save, sender=SupportRoom)
def room_status_changed(sender, instance, created, **kwargs):
    """
    Handle room status changes
    """
    if created and instance.status == 'pending':
        # New support request
        notify_new_support_request(instance)
    
    elif not created:
        # Check if agent was just assigned
        if instance.status == 'active' and instance.support_agent:
            old_instance = SupportRoom.objects.get(pk=instance.pk)
            if old_instance.status == 'pending':
                notify_agent_joined(instance)
        
        # Check if room was closed
        if instance.status in ['resolved', 'closed']:
            notify_room_closed(instance)


@receiver(post_save, sender=ChatMessage)
def new_message_created(sender, instance, created, **kwargs):
    """
    Handle new messages
    """
    if created and instance.sender_type != 'bot':
        notify_new_message(instance.room, instance.sender)