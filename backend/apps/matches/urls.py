from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SportViewSet,
    LeagueViewSet,
    TeamViewSet,
    MatchViewSet,
    AvailableSportsAPIView,
    LeagueOddsAPIView,
    LiveScoresAPIView,
    APIBackendHealthCheck,
    MatchStatsView,
    LineupView,
    AdminMatchesListView,
    upcoming_matches,
    MatchResultsAPIView
)

# 1. Initialize the router
router = DefaultRouter()

# 2. 🔥 REGISTER THE VIEWSETS (This fixes the blank dropdowns!)
router.register(r'sports', SportViewSet, basename='sport')
router.register(r'leagues', LeagueViewSet, basename='league')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'local-matches', MatchViewSet, basename='local-match')

urlpatterns = [
    # This includes the auto-generated CRUD routes for your dropdowns
    path('', include(router.urls)),

    # ✅ MAIN ENDPOINT (USE THIS IN FRONTEND)
    path('upcoming/', upcoming_matches),
    path('admin-fixtures/', AdminMatchesListView.as_view(), name='admin-matches-list'),

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