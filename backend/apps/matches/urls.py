from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    AvailableSportsAPIView, 
    LeagueOddsAPIView, 
    LiveScoresAPIView,
    APIBackendHealthCheck,
    MatchDetailView,
    MatchStatsView,
    LineupView
)

router = DefaultRouter()



urlpatterns = [
    # Local Database Endpoints
    path('', include(router.urls)),
    path('live/', views.LiveMatchesView.as_view(), name='live-matches'),
    path('upcoming/', views.UpcomingMatchesView.as_view(), name='upcoming-matches'),
    path('external/live/', LiveScoresAPIView.as_view(), {'sport_key': 'upcoming'}, name='external-live-alias'),    path('completed/', views.CompletedMatchesView.as_view(), name='completed-matches'),
    # apps/matches/urls.py

    #path('<str:match_id>/stats/', MatchStatsView.as_view()),
    #path('<str:match_id>/home-lineup/', LineupView.as_view()),
    path('<str:match_id>/', MatchDetailView.as_view(), name='match-detail'),
    path('<str:match_id>/stats/', MatchStatsView.as_view(), name='match-stats'),
    path('<str:match_id>/home-lineup/', LineupView.as_view(), name='home-lineup'),
    path('<str:match_id>/away-lineup/', LineupView.as_view(), name='away-lineup'),

    # New External API endpoints (The Odds API)
    # Lists all available leagues/sports
    path('external/active-sports/', AvailableSportsAPIView.as_view(), name='active-sports'),
    
    # Get odds for a specific league using its key (e.g. soccer_epl)
    path('external/odds/<int:league_id>/', LeagueOddsAPIView.as_view(), name='league-odds'),
    
    # Get live scores for a specific league
    path('external/scores/<str:sport_key>/', LiveScoresAPIView.as_view(), name='league-scores'),
    
    # Health check for the new service
    path('external/health/', APIBackendHealthCheck.as_view(), name='api-health'),
]