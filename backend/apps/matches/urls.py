from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AvailableSportsAPIView,
    LeagueOddsAPIView,
    LiveScoresAPIView,
    APIBackendHealthCheck,
    MatchStatsView,
    LineupView,
    upcoming_matches,
    MatchResultsAPIView
)

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),

    # ✅ MAIN ENDPOINT (USE THIS IN FRONTEND)
    path('upcoming/', upcoming_matches),

    # Live scores
    path('scores/<str:sport_key>/', LiveScoresAPIView.as_view()),

    # Odds
    path('odds/<str:sport_key>/', LeagueOddsAPIView.as_view()),

    # Sports list
    path('external/active-sports/', AvailableSportsAPIView.as_view()),

    # Health check
    path('external/health/', APIBackendHealthCheck.as_view()),

    # Extras
    path('<str:match_id>/stats/', MatchStatsView.as_view()),
    path('<str:match_id>/lineup/', LineupView.as_view()),
    path('matches/results/<str:sport_key>/', MatchResultsAPIView.as_view(), name='match-results'),
]