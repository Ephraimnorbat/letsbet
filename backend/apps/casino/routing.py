# apps/casino/routing.py
from django.urls import path
from .consumers import CrashGameConsumer

websocket_urlpatterns = [
    path("ws/casino/crash/", CrashGameConsumer.as_asgi()),
]