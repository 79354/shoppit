from django.urls import path
from . import views

urlpatterns = [
    # Room management
    path('create-room/', views.create_support_room, name='create-support-room'),
    path('rooms/', views.get_user_rooms, name='get-user-rooms'),
    path('rooms/pending/', views.get_pending_rooms, name='get-pending-rooms'),
    path('rooms/<str:room_id>/accept/', views.accept_support_room, name='accept-support-room'),
    path('rooms/<str:room_id>/close/', views.close_support_room, name='close-support-room'),
    
    # Messages
    path('rooms/<str:room_id>/messages/', views.get_room_messages, name='get-room-messages'),
    path('rooms/<str:room_id>/send/', views.send_message, name='send-message'),
    
    # Notifications
    path('notifications/', views.get_notifications, name='get-notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
]