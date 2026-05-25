from django.urls import path
from .views import CreateDepositView, NowPaymentsWebhookView, RequestWithdrawalView

urlpatterns = [
    path('deposit/', CreateDepositView.as_view(), name='deposit'),
    path('webhook/', NowPaymentsWebhookView.as_view(), name='webhook'),
    path('withdraw/',RequestWithdrawalView.as_view(), name='withdraw'),
]