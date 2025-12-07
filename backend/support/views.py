from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import SupportRoom, ChatMessage, SupportNotification
from .serializers import (
    SupportRoomSerializer, 
    ChatMessageSerializer, 
    SupportNotificationSerializer
)
from google import genai
from django.conf import settings

# Initialize AI client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_support_room(request):
    """Create a new support room for the customer"""
    user = request.user
    subject = request.data.get('subject', 'Support Request')
    
    # Check if user already has an active room
    existing_room = SupportRoom.objects.filter(
        customer=user, 
        status__in=['active', 'pending']
    ).first()
    
    if existing_room:
        serializer = SupportRoomSerializer(existing_room)
        return Response({
            'message': 'You already have an active support room',
            'room': serializer.data
        }, status=status.HTTP_200_OK)
    
    # Create new room
    room = SupportRoom.objects.create(
        customer=user,
        subject=subject,
        status='pending'
    )
    
    # Create initial bot message
    ChatMessage.objects.create(
        room=room,
        sender_type='bot',
        message="Hello! I'm here to help. How can I assist you today?"
    )
    
    # Notify all support agents
    support_agents = request.user.__class__.objects.filter(
        is_staff=True,
        is_active=True
    )
    
    for agent in support_agents:
        SupportNotification.objects.create(
            support_agent=agent,
            room=room,
            notification_type='new_request',
            message=f'New support request from {user.email}'
        )
    
    serializer = SupportRoomSerializer(room)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    """Send a message in a support room"""
    user = request.user
    message_text = request.data.get('message')
    
    if not message_text:
        return Response(
            {'error': 'Message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    room = get_object_or_404(SupportRoom, room_id=room_id)
    
    # Verify user is part of this room
    if room.customer != user and room.support_agent != user:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Determine sender type
    sender_type = 'customer' if room.customer == user else 'agent'
    
    # Create message
    message = ChatMessage.objects.create(
        room=room,
        sender=user,
        sender_type=sender_type,
        message=message_text
    )
    
    # If customer sent message and room status is pending, try bot response
    if sender_type == 'customer' and room.status == 'pending':
        bot_response = get_bot_response(message_text, room)
        
        if bot_response:
            ChatMessage.objects.create(
                room=room,
                sender_type='bot',
                message=bot_response
            )
    
    # Notify the other party
    if sender_type == 'customer' and room.support_agent:
        SupportNotification.objects.create(
            support_agent=room.support_agent,
            room=room,
            notification_type='message',
            message=f'New message from {user.email}'
        )
    
    serializer = ChatMessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def get_bot_response(message_text, room):
    """Get AI bot response"""
    try:
        # Check if bot should escalate to human
        escalation_keywords = [
            'speak to human', 'real person', 'agent', 
            'representative', 'not helpful', 'doesn\'t work'
        ]
        
        if any(keyword in message_text.lower() for keyword in escalation_keywords):
            return ("I understand you'd like to speak with a human agent. "
                   "Let me connect you with our support team. "
                   "An agent will be with you shortly.")
        
        # Get previous messages for context
        previous_messages = ChatMessage.objects.filter(room=room).order_by('-created_at')[:5]
        context = "\n".join([
            f"{msg.sender_type}: {msg.message}" 
            for msg in reversed(previous_messages)
        ])
        
        prompt = f"""You are a helpful e-commerce customer support bot. 
        
Previous conversation:
{context}

Current customer message: {message_text}

Provide a helpful, concise response. If you cannot fully resolve the issue, 
suggest they can speak to a human agent. Keep responses under 100 words."""
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        
        return response.text.strip()
        
    except Exception as e:
        print(f"Bot error: {e}")
        return "I'm having trouble processing that. Would you like to speak with a human agent?"


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_messages(request, room_id):
    """Get all messages in a support room"""
    user = request.user
    room = get_object_or_404(SupportRoom, room_id=room_id)
    
    # Verify access
    if room.customer != user and room.support_agent != user and not user.is_staff:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    messages = ChatMessage.objects.filter(room=room)
    
    # Mark messages as read
    if room.support_agent == user:
        messages.filter(sender_type='customer', is_read=False).update(is_read=True)
    elif room.customer == user:
        messages.filter(sender_type='agent', is_read=False).update(is_read=True)
    
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_rooms(request):
    """Get all support rooms for the current user"""
    user = request.user
    
    if user.is_staff:
        # Support agents see assigned rooms
        rooms = SupportRoom.objects.filter(support_agent=user)
    else:
        # Customers see their own rooms
        rooms = SupportRoom.objects.filter(customer=user)
    
    serializer = SupportRoomSerializer(rooms, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_rooms(request):
    """Get all pending support requests (for agents)"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    rooms = SupportRoom.objects.filter(status='pending')
    serializer = SupportRoomSerializer(rooms, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_support_room(request, room_id):
    """Accept a pending support request"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    room = get_object_or_404(SupportRoom, room_id=room_id)
    
    if room.status != 'pending':
        return Response(
            {'error': 'Room is not pending'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Assign agent and activate room
    room.support_agent = request.user
    room.status = 'active'
    room.save()
    
    # Send system message
    ChatMessage.objects.create(
        room=room,
        sender_type='bot',
        message=f'Support agent {request.user.username} has joined the chat.'
    )
    
    # Notify customer (you can implement push notifications here)
    
    serializer = SupportRoomSerializer(room)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def close_support_room(request, room_id):
    """Close a support room"""
    user = request.user
    room = get_object_or_404(SupportRoom, room_id=room_id)
    
    # Only agent or customer can close
    if room.customer != user and room.support_agent != user:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    room.status = 'resolved'
    room.resolved_at = timezone.now()
    room.save()
    
    # Send closing message
    ChatMessage.objects.create(
        room=room,
        sender_type='bot',
        message='This support conversation has been closed. Thank you!'
    )
    
    serializer = SupportRoomSerializer(room)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get notifications for support agent"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    notifications = SupportNotification.objects.filter(
        support_agent=request.user,
        is_read=False
    )
    
    serializer = SupportNotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    notification = get_object_or_404(
        SupportNotification,
        id=notification_id,
        support_agent=request.user
    )
    
    notification.is_read = True
    notification.save()
    
    return Response({'message': 'Notification marked as read'})