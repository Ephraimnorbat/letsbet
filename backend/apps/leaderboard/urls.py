from django.urls import path
from . import views

urlpatterns = [
    path('top/', views.TopLeaderboardView.as_view(), name='top-leaderboard'),
    path('weekly/', views.WeeklyLeaderboardView.as_view(), name='weekly-leaderboard'),
    path('monthly/', views.MonthlyLeaderboardView.as_view(), name='monthly-leaderboard'),
    path('all-time/', views.AllTimeLeaderboardView.as_view(), name='all-time-leaderboard'),
    path('my-rank/', views.UserLeaderboardRankView.as_view(), name='my-rank'),
]