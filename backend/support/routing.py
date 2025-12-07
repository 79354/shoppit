from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/support/chat/(?P<room_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/support/notifications/$', consumers.NotificationConsumer.as_asgi()),
]