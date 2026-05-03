from django.urls import path
from .views import CreateDepositView, NowPaymentsWebhookView

urlpatterns = [
    path('deposit/', CreateDepositView.as_view(), name='deposit'),
    path('webhook/', NowPaymentsWebhookView.as_view(), name='webhook'),
]