"""
ASGI config for api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application

# 1. Setup the environment variable configuration
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

# 2. Force Django to fully populate its application and model registries
django.setup()

# 3. Initialize the HTTP ASGI handler
django_asgi_app = get_asgi_application()

# 4. Now that registries are ready, it is safe to import Channels components and app routing files
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

import apps.payments.routing
import apps.casino.routing  

# 5. Build your core Protocol Router map configuration
application = ProtocolTypeRouter({
    # Standard HTTP handling
    "http": django_asgi_app,
    
    # Secure real-time socket connections
    "websocket": AuthMiddlewareStack(
        URLRouter([
            # Crash game socket endpoints checked first
            *apps.casino.routing.websocket_urlpatterns,
            
            # Payment processing socket endpoints checked second
            *apps.payments.routing.websocket_urlpatterns,
        ])
    ),
})