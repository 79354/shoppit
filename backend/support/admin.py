from django.contrib import admin
from .models import SupportRoom, ChatMessage, SupportNotification


@admin.register(SupportRoom)
class SupportRoomAdmin(admin.ModelAdmin):
    list_display = ('room_id', 'customer', 'support_agent', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('room_id', 'customer__email', 'support_agent__email')
    readonly_fields = ('room_id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Room Information', {
            'fields': ('room_id', 'customer', 'support_agent', 'status', 'subject')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at')
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('room', 'sender_type', 'message_preview', 'is_read', 'created_at')
    list_filter = ('sender_type', 'is_read', 'created_at')
    search_fields = ('room__room_id', 'message', 'sender__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'


@admin.register(SupportNotification)
class SupportNotificationAdmin(admin.ModelAdmin):
    list_display = ('support_agent', 'room', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('support_agent__email', 'room__room_id', 'message')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)