from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    PopularLeaguesAPIView, 
    AllCountriesAPIView, 
    LiveMatchesAPIView,
    MatchesByDateAPIView, 
    # MatchesByDateAndLeagueAPIView, 
    MatchesByLeagueAPIView,
    SearchPlayersAPIView,
    MatchOddsAPIView,
    MatchOddsPollAPIView,
    MatchStatisticsAPIView,
    MatchFirstHalfStatsAPIView,
    MatchSecondHalfStatsAPIView,
    HomeTeamLineupAPIView,
    AwayTeamLineupAPIView,
    TrendingNewsAPIView,
    LeagueNewsAPIView,
    TeamNewsAPIView
)

router = DefaultRouter()
router.register(r'sports', views.SportViewSet)
router.register(r'leagues', views.LeagueViewSet)
router.register(r'teams', views.TeamViewSet)
router.register(r'all', views.MatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('live/', views.LiveMatchesView.as_view(), name='live-matches'),
    path('upcoming/', views.UpcomingMatchesView.as_view(), name='upcoming-matches'),
    path('completed/', views.CompletedMatchesView.as_view(), name='completed-matches'),
    
    # External API endpoints
    path('external/popular-leagues/', PopularLeaguesAPIView.as_view(), name='popular-leagues'),
    path('external/countries/', AllCountriesAPIView.as_view(), name='countries'),
    path('external/live/', LiveMatchesAPIView.as_view(), name='live-matches-external'),
    path('external/matches-by-date/', MatchesByDateAPIView.as_view(), name='matches-by-date'),
    # path('external/matches-by-date-league/', MatchesByDateAndLeagueAPIView.as_view(), name='matches-by-date-league'),
    path('external/matches-by-league/<int:league_id>/', MatchesByLeagueAPIView.as_view(), name='matches-by-league'),
    path('external/search-players/', SearchPlayersAPIView.as_view(), name='search-players'),
    path('external/odds/<int:event_id>/', MatchOddsAPIView.as_view(), name='match-odds'),
    path('external/odds-poll/<int:event_id>/', MatchOddsPollAPIView.as_view(), name='match-odds-poll'),
    path('external/statistics/<int:event_id>/', MatchStatisticsAPIView.as_view(), name='match-statistics'),
    path('external/statistics/first-half/<int:event_id>/', MatchFirstHalfStatsAPIView.as_view(), name='match-first-half-stats'),
    path('external/statistics/second-half/<int:event_id>/', MatchSecondHalfStatsAPIView.as_view(), name='match-second-half-stats'),
    path('external/lineup/home/<int:event_id>/', HomeTeamLineupAPIView.as_view(), name='home-lineup'),
    path('external/lineup/away/<int:event_id>/', AwayTeamLineupAPIView.as_view(), name='away-lineup'),
    path('external/news/trending/', TrendingNewsAPIView.as_view(), name='trending-news'),
    path('external/news/league/<int:league_id>/', LeagueNewsAPIView.as_view(), name='league-news'),
    path('external/news/team/<int:team_id>/', TeamNewsAPIView.as_view(), name='team-news'),
]