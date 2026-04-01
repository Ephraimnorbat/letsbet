from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bet-types', views.BetTypeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('place/', views.PlaceBetView.as_view(), name='place-bet'),
    path('my-bets/', views.MyBetsView.as_view(), name='my-bets'),
    path('pending/', views.PendingBetsView.as_view(), name='pending-bets'),
    path('history/', views.BetHistoryView.as_view(), name='bet-history'),
    path('cashout/<int:bet_id>/', views.CashoutBetView.as_view(), name='cashout-bet'),
    path('parlay/', views.ParlayBetView.as_view(), name='parlay-bet'),
]