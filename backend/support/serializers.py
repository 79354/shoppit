from rest_framework import serializers
from .models import SupportRoom, ChatMessage, SupportNotification
from core.models import CustomUser

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username']


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_info = UserBasicSerializer(source='sender', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'sender', 'sender_info', 'sender_type',
            'message', 'is_read', 'created_at'
        ]


class SupportRoomSerializer(serializers.ModelSerializer):
    customer_info = UserBasicSerializer(source='customer', read_only=True)
    agent_info = UserBasicSerializer(source='support_agent', read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportRoom
        fields = [
            'id', 'room_id', 'customer', 'customer_info',
            'support_agent', 'agent_info', 'status', 'subject',
            'created_at', 'updated_at', 'resolved_at',
            'unread_count', 'last_message'
        ]
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        
        user = request.user
        if obj.support_agent == user:
            return obj.messages.filter(sender_type='customer', is_read=False).count()
        elif obj.customer == user:
            return obj.messages.filter(sender_type='agent', is_read=False).count()
        return 0
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'message': last_msg.message,
                'sender_type': last_msg.sender_type,
                'created_at': last_msg.created_at
            }
        return None


class SupportNotificationSerializer(serializers.ModelSerializer):
    room_info = SupportRoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = SupportNotification
        fields = [
            'id', 'room', 'room_info', 'notification_type',
            'message', 'is_read', 'created_at'
        ]