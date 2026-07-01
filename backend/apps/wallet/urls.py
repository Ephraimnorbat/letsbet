from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.payments.views import AdminDepositsListView, AdminWithdrawalsListView, ProcessWithdrawalView


router = DefaultRouter()
router.register(r'vouchers', views.VoucherViewSet, basename='voucher')
router.register(r'voucher-types', views.VoucherTypeViewSet, basename='voucher-type')

urlpatterns = [

    # 🔥 Admin dashboard panel routers
    path('admin-deposits/', AdminDepositsListView.as_view(), name='admin-deposits-list'),
    path('admin-withdrawals/', AdminWithdrawalsListView.as_view(), name='admin-withdrawals-list'),
    path('admin-withdrawals/<int:pk>/process/', ProcessWithdrawalView.as_view(), name='wallet-admin-process-withdrawal'),
    path("admin-audit/", views.AdminWalletAuditView.as_view(), name="wallet-admin-audit",),
    path('', include(router.urls)),
    path('balance/', views.WalletBalanceView.as_view(), name='wallet-balance'),

    path('transactions/', views.TransactionHistoryView.as_view(), name='transactions'),
]