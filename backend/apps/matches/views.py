from rest_framework import viewsets, filters, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAdminUser, SAFE_METHODS


from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

import logging

from .models import Sport, League, Team, Match
from .serializers import (
    SportSerializer, LeagueSerializer, TeamSerializer,
    MatchSerializer, MatchListSerializer, LiveMatchSerializer
)

from .services import sports_api

logger = logging.getLogger(__name__)

# ================= LOCAL DATABASE =================

class SportViewSet(viewsets.ModelViewSet):
    queryset = Sport.objects.filter(is_active=True)
    serializer_class = SportSerializer
    permission_classes = [IsAuthenticated]

    @method_decorator(cache_page(60 * 15))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


class LeagueViewSet(viewsets.ModelViewSet):
    queryset = League.objects.filter(is_active=True)
    serializer_class = LeagueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['sport', 'country']
    search_fields = ['name']

    @method_decorator(cache_page(60 * 10))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

class MatchesCRUDView(generics.ListCreateAPIView):
    """
    View for admin to create and list matches
    """
    queryset = Match.objects.all().order_by('-match_date')
    serializer_class = MatchSerializer
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            # Get single match
            try:
                match = Match.objects.get(pk=kwargs['pk'])
                serializer = self.get_serializer(match)
                return Response(serializer.data)
            except Match.DoesNotExist:
                return Response(
                    {"error": "Match not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        return super().get(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        # Update match
        try:
            match = Match.objects.get(pk=kwargs['pk'])
            serializer = self.get_serializer(match, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Match.DoesNotExist:
            return Response(
                {"error": "Match not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, *args, **kwargs):
        # Delete match
        try:
            match = Match.objects.get(pk=kwargs['pk'])
            match.delete()
            return Response(
                {"message": "Match deleted successfully"},
                status=status.HTTP_200_OK
            )
        except Match.DoesNotExist:
            return Response(
                {"error": "Match not found"},
                status=status.HTTP_404_NOT_FOUND
            )
@api_view(['GET'])
def upcoming_odds(request):
    """
    Get odds for upcoming matches across all valid sports
    """
    cache_key = "upcoming_odds_all"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response({
            "status": "success",
            "data": cached_data,
            "source": "cache"
        })
    
    odds_data = []
    
    # ✅ Fetch all active sports from the API
    all_sports = sports_api.get_all_active_sports()
    
    if all_sports:
        # ✅ Filter only sports that have 'odds' support
        # The Odds API returns sports with a 'has_odds' field or we check if they're in our list
        valid_sports = []
        for sport in all_sports:
            sport_key = sport.get('key')
            # Check if sport supports odds (the API should return has_odds: true)
            if sport.get('has_odds', False) or sport_key in sports_api.get_valid_odds_sports():
                valid_sports.append(sport_key)
        
        logger.info(f"Found {len(valid_sports)} sports with odds support")
        
        # ✅ Limit to first 5 sports to avoid rate limits
        for sport_key in valid_sports[:5]:
            try:
                logger.info(f"Fetching odds for: {sport_key}")
                odds = sports_api.get_odds(sport_key)
                if odds and len(odds) > 0:
                    for match in odds:
                        match['sport_key'] = sport_key
                    odds_data.extend(odds)
                    logger.info(f"Fetched {len(odds)} matches for {sport_key}")
                else:
                    logger.info(f"No odds returned for {sport_key}")
            except Exception as e:
                logger.error(f"Error fetching odds for {sport_key}: {e}")
    else:
        # ✅ Fallback: use the hardcoded list if API fails
        logger.warning("Could not fetch sports list, using fallback")
        fallback_sports = ['soccer_epl', 'basketball_nba', 'americanfootball_nfl']
        for sport_key in fallback_sports:
            try:
                odds = sports_api.get_odds(sport_key)
                if odds:
                    for match in odds:
                        match['sport_key'] = sport_key
                    odds_data.extend(odds)
            except Exception as e:
                logger.error(f"Error fetching fallback odds for {sport_key}: {e}")
    
    # Cache for 5 minutes
    cache.set(cache_key, odds_data, timeout=300)
    
    return Response({
        "status": "success",
        "data": odds_data,
        "total": len(odds_data)
    })


class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all().order_by('-match_date')
    
    # Allow anyone to read (GET, HEAD, OPTIONS), but require admin for POST, PUT, PATCH, DELETE
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        return MatchSerializer


# ================= SIMPLE LOCAL MATCH LISTS =================

class LiveMatchesView(generics.ListAPIView):
    serializer_class = LiveMatchSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Match.objects.filter(status__in=['live', 'halftime'])


# ⚠️ Keep only if you REALLY use DB matches
class UpcomingMatchesView(generics.ListAPIView):
    serializer_class = MatchListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Match.objects.filter(
            status='scheduled',
            match_date__gte=timezone.now()
        ).order_by('match_date')[:50]

class AdminMatchesListView(generics.ListAPIView):
    """
    Returns a list of all matches manually created or managed via the database.
    Can filter for matches where external_id is null (manually added by Admin)
    or just return all local DB matches.
    """
    serializer_class = MatchListSerializer
    permission_classes = [AllowAny] # Anyone can view these fixtures to bet on them

    def get_queryset(self):
        # Filter for entries created manually in the admin dashboard (no external API id)
        return Match.objects.filter(external_id__isnull=True).order_by('-match_date')

# ================= MAIN API (IMPORTANT) =================

@api_view(['GET'])
def upcoming_matches(request):
    # Get sport_key from query params if available, else default to epl
    sport_key = request.query_params.get('sport_key', 'soccer_epl')
    cache_key = f"upcoming_matches_{sport_key}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return Response(cached_data)

    data = sports_api.get_upcoming_matches(sport_key)
    
    if data:
        # Cache upcoming fixtures for 10 minutes (less volatile than scores)
        cache.set(cache_key, data, timeout=600)
        
    return Response(data)


class LiveScoresAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, sport_key='upcoming'):
        cache_key = f"live_scores_{sport_key}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response({
                "status": "success",
                "data": cached_data,
                "source": "cache"
            })

        data = sports_api.get_live_scores(sport_key)
        
        if data:
            # Cache scores for 60 seconds (volatile data)
            cache.set(cache_key, data, timeout=60)

        return Response({
            "status": "success",
            "data": data if data else []
        })


class AvailableSportsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = "all_active_sports"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response({"status": "success", "data": cached_data, "source": "cache"})

        data = sports_api.get_all_active_sports()
        
        if data:
            # Sports list rarely changes; cache for 1 hour
            cache.set(cache_key, data, timeout=3600)

        return Response({"status": "success", "data": data})


class LeagueOddsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, sport_key):
        # 1. Create a unique cache key based on the sport
        cache_key = f"odds_data_{sport_key}"
        cached_response = cache.get(cache_key)

        # 2. Return cached data if it exists
        if cached_response:
            return Response({
                "status": "success",
                "data": cached_response,
                "source": "cache" # Useful for debugging
            })

        # 3. Fetch from external API if cache is empty
        data = sports_api.get_odds(sport_key)
        
        # 4. Save to cache for 300 seconds (5 minutes)
        if data:
            cache.set(cache_key, data, timeout=300)

        return Response({
            "status": "success",
            "data": data if data else []
        })

class AllMatchesView(generics.ListAPIView):
    """
    Returns ALL matches from the database.
    This includes both external API matches and admin-created fixtures.
    """
    serializer_class = MatchListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Match.objects.all().order_by('-match_date')
        
        # ✅ Optional: filter by league
        league_id = self.request.query_params.get('league')
        if league_id:
            queryset = queryset.filter(league_id=league_id)
        
        # ✅ Optional: filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # ✅ Limit to 100 for performance
        return queryset[:100]
    
class MatchResultsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, sport_key='upcoming'):
        cache_key = f"match_results_{sport_key}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response({
                "status": "success",
                "data": cached_data,
                "source": "cache"
            })

        # ✅ First, try to get results from your DATABASE
        db_results = Match.objects.filter(
            status__in=['finished', 'completed', 'FT']
        ).order_by('-match_date')[:50]

        if db_results.exists():
            serializer = MatchListSerializer(db_results, many=True)
            cache.set(cache_key, serializer.data, timeout=1800)
            return Response({
                "status": "success",
                "data": serializer.data,
                "source": "database"
            })

        # ✅ If no DB results, try external API
        raw_data = sports_api.get_live_scores(sport_key)
        
        if not raw_data:
            return Response({
                "status": "success",
                "data": [],
                "message": "No completed matches found"
            })

        # ✅ Filter for completed matches (handle different API response formats)
        results = []
        for match in raw_data:
            # The Odds API uses 'completed' field
            if match.get('completed') == True:
                results.append(match)
            # Some APIs use 'status' field
            elif match.get('status') in ['FT', 'Finished', 'completed']:
                results.append(match)
            # Check if scores exist (indicates match is finished)
            elif match.get('home_score') is not None and match.get('away_score') is not None:
                results.append(match)

        # Cache for 30 minutes
        cache.set(cache_key, results, timeout=1800)

        return Response({
            "status": "success",
            "data": results,
            "source": "external_api",
            "total": len(results)
        })
    
class APIBackendHealthCheck(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = sports_api.get_all_active_sports()
        return Response({
            'status': 'healthy' if data else 'unhealthy'
        })


# ================= OPTIONAL (SAFE DUMMY DATA) =================

class MatchStatsView(APIView):
    def get(self, request, match_id):
        return Response({
            "home_possession": 50,
            "away_possession": 50,
            "home_shots": 0,
            "away_shots": 0,
        })


class LineupView(APIView):
    def get(self, request, match_id):
        return Response({
            "home_lineup": [],
            "away_lineup": [],
        })