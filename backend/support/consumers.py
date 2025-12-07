#websocket consumers
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import SupportRoom, ChatMessage, SupportNotification
from google import genai
from django.conf import settings

User = get_user_model()
client = genai.Client(api_key=settings.GEMINI_API_KEY)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        # Verify user has access to this room
        has_access = await self.verify_room_access()
        if not has_access:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to chat room'
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'chat_message':
            message_text = data.get('message')
            
            # Save message to database
            message, room = await self.save_message(message_text)
            
            # Broadcast to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_text,
                    'sender_type': message['sender_type'],
                    'sender_email': message['sender_email'],
                    'timestamp': message['timestamp'],
                    'message_id': message['id']
                }
            )

            # If customer sent message and room is pending, get bot response
            if message['sender_type'] == 'customer' and room['status'] == 'pending':
                bot_response = await self.get_bot_response(message_text, room)
                
                if bot_response:
                    # Check if needs escalation
                    needs_escalation = await self.check_escalation(message_text)
                    
                    # Save bot message
                    bot_message = await self.save_bot_message(bot_response)
                    
                    # Broadcast bot response
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': bot_response,
                            'sender_type': 'bot',
                            'sender_email': 'AI Assistant',
                            'timestamp': bot_message['timestamp'],
                            'message_id': bot_message['id']
                        }
                    )
                    
                    # If escalation needed, notify agents
                    if needs_escalation:
                        await self.notify_all_agents(room)

            # If customer sent message to active room, notify agent
            elif message['sender_type'] == 'customer' and room['status'] == 'active':
                await self.notify_assigned_agent(room)

            # If agent sent message, notify customer
            elif message['sender_type'] == 'agent':
                await self.notify_customer(room)

        elif message_type == 'typing':
            # Broadcast typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_email': self.user.email,
                    'is_typing': data.get('is_typing', False)
                }
            )

        elif message_type == 'mark_read':
            # Mark messages as read
            await self.mark_messages_read()

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_type': event['sender_type'],
            'sender_email': event['sender_email'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id']
        }))

    async def typing_indicator(self, event):
        # Send typing indicator to WebSocket
        if event['user_email'] != self.user.email:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_email': event['user_email'],
                'is_typing': event['is_typing']
            }))

    async def notification(self, event):
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification_type': event['notification_type'],
            'message': event['message'],
            'room_id': event.get('room_id')
        }))

    @database_sync_to_async
    def verify_room_access(self):
        try:
            room = SupportRoom.objects.get(room_id=self.room_id)
            return (room.customer == self.user or 
                    room.support_agent == self.user or 
                    self.user.is_staff)
        except SupportRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_text):
        room = SupportRoom.objects.get(room_id=self.room_id)
        sender_type = 'customer' if room.customer == self.user else 'agent'
        
        message = ChatMessage.objects.create(
            room=room,
            sender=self.user,
            sender_type=sender_type,
            message=message_text
        )
        
        return {
            'id': message.id,
            'message': message.message,
            'sender_type': message.sender_type,
            'sender_email': self.user.email,
            'timestamp': message.created_at.isoformat()
        }, {
            'status': room.status,
            'room_id': room.room_id
        }

    @database_sync_to_async
    def save_bot_message(self, message_text):
        room = SupportRoom.objects.get(room_id=self.room_id)
        
        message = ChatMessage.objects.create(
            room=room,
            sender_type='bot',
            message=message_text
        )
        
        return {
            'id': message.id,
            'message': message.message,
            'timestamp': message.created_at.isoformat()
        }

    @database_sync_to_async
    def get_bot_response(self, message_text, room_data):
        try:
            room = SupportRoom.objects.get(room_id=room_data['room_id'])
            previous_messages = ChatMessage.objects.filter(room=room).order_by('-created_at')[:5]
            
            context = "\n".join([
                f"{msg.sender_type}: {msg.message}" 
                for msg in reversed(previous_messages)
            ])
            
            prompt = f"""You are a helpful e-commerce customer support bot for an online store.

Previous conversation:
{context}

Current customer message: {message_text}

Provide a helpful, concise response about:
- Order status and tracking
- Product information
- Returns and refunds
- Account issues
- General inquiries

If you cannot fully resolve the issue or the customer seems frustrated, 
politely suggest they can speak to a human agent. Keep responses under 100 words."""
            
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Bot error: {e}")
            return "I'm having trouble processing that. Would you like to speak with a human agent?"

    @database_sync_to_async
    def check_escalation(self, message_text):
        escalation_keywords = [
            'speak to human', 'real person', 'agent', 'representative',
            'not helpful', 'doesn\'t work', 'frustrated', 'angry',
            'manager', 'supervisor', 'human help', 'talk to someone'
        ]
        return any(keyword in message_text.lower() for keyword in escalation_keywords)

    @database_sync_to_async
    def notify_all_agents(self, room_data):
        room = SupportRoom.objects.get(room_id=room_data['room_id'])
        support_agents = User.objects.filter(is_staff=True, is_active=True)
        
        for agent in support_agents:
            SupportNotification.objects.create(
                support_agent=agent,
                room=room,
                notification_type='new_request',
                message=f'Customer needs help: {room.customer.email}'
            )

    @database_sync_to_async
    def notify_assigned_agent(self, room_data):
        room = SupportRoom.objects.get(room_id=room_data['room_id'])
        if room.support_agent:
            SupportNotification.objects.create(
                support_agent=room.support_agent,
                room=room,
                notification_type='message',
                message=f'New message from {room.customer.email}'
            )

    @database_sync_to_async
    def notify_customer(self, room_data):
        # This would integrate with push notification service
        # For now, we'll just log it
        room = SupportRoom.objects.get(room_id=room_data['room_id'])
        print(f"Notify customer {room.customer.email}: New message from agent")

    @database_sync_to_async
    def mark_messages_read(self):
        room = SupportRoom.objects.get(room_id=self.room_id)
        
        if room.support_agent == self.user:
            ChatMessage.objects.filter(
                room=room, 
                sender_type='customer', 
                is_read=False
            ).update(is_read=True)
        elif room.customer == self.user:
            ChatMessage.objects.filter(
                room=room, 
                sender_type='agent', 
                is_read=False
            ).update(is_read=True)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        if not self.user.is_staff:
            await self.close()
            return
        
        self.notification_group_name = f'notifications_{self.user.id}'
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data.get('type') == 'mark_all_read':
            await self.mark_all_notifications_read()

    async def notification(self, event):
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification_type': event['notification_type'],
            'message': event['message'],
            'room_id': event.get('room_id'),
            'timestamp': event.get('timestamp')
        }))

    @database_sync_to_async
    def mark_all_notifications_read(self):
        SupportNotification.objects.filter(
            support_agent=self.user,
            is_read=False
        ).update(is_read=True)