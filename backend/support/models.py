# backend/support/models.py
from django.db import models
from django.conf import settings
import uuid

class SupportRoom(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('resolved', 'Resolved'),
        ('pending', 'Pending'),
        ('closed', 'Closed'),
    )
    
    room_id = models.CharField(max_length=100, unique=True, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='support_rooms'
    )
    support_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_rooms'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subject = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.room_id:
            self.room_id = f"room_{uuid.uuid4().hex[:12]}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.room_id} - {self.customer.email}"
    
    class Meta:
        ordering = ['-created_at']


class ChatMessage(models.Model):
    SENDER_TYPES = (
        ('customer', 'Customer'),
        ('agent', 'Support Agent'),
        ('bot', 'Bot'),
    )
    
    room = models.ForeignKey(SupportRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.sender_type}: {self.message[:50]}"
    
    class Meta:
        ordering = ['created_at']


class SupportNotification(models.Model):
    NOTIFICATION_TYPES = (
        ('new_request', 'New Support Request'),
        ('message', 'New Message'),
        ('assigned', 'Room Assigned'),
        ('resolved', 'Room Resolved'),
    )
    
    support_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_notifications'
    )
    room = models.ForeignKey(SupportRoom, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.notification_type} - {self.room.room_id}"
    
    class Meta:
        ordering = ['-created_at']