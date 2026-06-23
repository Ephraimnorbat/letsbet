from django.urls import path
from .views import UserCrashBetHistoryView, CrashAdminMetricsView

urlpatterns = [
    path('crash/my-history/', UserCrashBetHistoryView.as_view(), name='user-crash-history'),
    path('crash/admin-metrics/', CrashAdminMetricsView.as_view(), name='crash-admin-metrics'),
]