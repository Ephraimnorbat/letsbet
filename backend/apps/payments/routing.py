

from django.urls import re_path
from .consumers import PaymentConsumer

websocket_urlpatterns = [
    re_path(r'ws/payments/$', PaymentConsumer.as_asgi()),
]