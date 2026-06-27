from django.urls import path
from . import views
from apps.payments.views import AdminDepositsListView, AdminWithdrawalsListView, ProcessWithdrawalView

urlpatterns = [
    path('balance/', views.WalletBalanceView.as_view(), name='wallet-balance'),
    # path('deposit/', views.DepositView.as_view(), name='deposit'),
    # path('withdraw/', views.WithdrawView.as_view(), name='withdraw'),
    path('transactions/', views.TransactionHistoryView.as_view(), name='transactions'),
    # 🔥 Admin dashboard panel routers
    path('admin-deposits/', AdminDepositsListView.as_view(), name='admin-deposits-list'),
    path('admin-withdrawals/', AdminWithdrawalsListView.as_view(), name='admin-withdrawals-list'),
    path('admin-withdrawals/<int:pk>/process/', ProcessWithdrawalView.as_view(), name='wallet-admin-process-withdrawal'),
]