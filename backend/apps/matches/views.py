from rest_framework import generics, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework import status
from django.shortcuts import get_object_or_404
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from .models import Sport, League, Team, Match, MatchEvent
from .serializers import (
    SportSerializer, LeagueSerializer, TeamSerializer,
    MatchSerializer, MatchListSerializer, LiveMatchSerializer
)
from .services import sports_api
import requests

# Get an instance of a logger for production monitoring
logger = logging.getLogger(__name__)

# ============= LOCAL DATABASE VIEWS =============

class SportViewSet(viewsets.ModelViewSet):
    queryset = Sport.objects.filter(is_active=True)
    serializer_class = SportSerializer
    permission_classes = [IsAuthenticated]
    
    # Cache the list of sports for 15 minutes as they rarely change
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

    # Cache for 10 minutes
    @method_decorator(cache_page(60 * 10))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['league', 'league__sport']
    search_fields = ['name']

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['league', 'status', 'match_date']
    ordering_fields = ['match_date', 'home_odds', 'away_odds']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        return MatchSerializer

class LiveMatchesView(generics.ListAPIView):
    serializer_class = LiveMatchSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Match.objects.filter(status__in=['live', 'halftime'])

class UpcomingMatchesView(generics.ListAPIView):
    serializer_class = MatchListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Match.objects.filter(
            status='scheduled',
            match_date__gte=timezone.now()
        ).order_by('match_date')[:50]

class CompletedMatchesView(generics.ListAPIView):
    serializer_class = MatchListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Match.objects.filter(status='finished').order_by('-match_date')[:50]


# ============= EXTERNAL API VIEWS - REAL DATA ONLY =============

class PopularLeaguesAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        cache_key = "api_popular_leagues"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        try:
            data = sports_api.get_popular_leagues()
            if data and data.get('status') == 'success':
                response_data = {'status': 'success', 'data': data}
                cache.set(cache_key, response_data, 3600)  # Cache for 1 hour
                return Response(response_data)
            return Response({'status': 'error', 'message': 'No data'}, status=404)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)


class AllCountriesAPIView(APIView):
    """Get all countries with football leagues - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            data = sports_api.get_all_countries()
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': 'No countries data available from API'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'API request timed out. Please try again.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)



class MatchesByDateAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        date = request.query_params.get('date', 'today')
        cache_key = f"matches_date_{date}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        try:
            data = sports_api.get_matches_by_date(date)
            if data and data.get('status') == 'success':
                response_data = {'status': 'success', 'data': data}
                # Cache for 2 minutes (live scores change often, but don't hammer the API)
                cache.set(cache_key, response_data, 120) 
                return Response(response_data)
            return Response({'status': 'error', 'message': 'Not found'}, status=404)
        except Exception:
            # If API fails but we have ANY old data in cache, try to return it
            return Response({'status': 'error', 'message': 'API Timeout'}, status=503)

class MatchesByLeagueAPIView(APIView):
    """Get all matches for a specific league - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, league_id):
        try:
            data = sports_api.get_matches_by_league(league_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No matches found for league ID: {league_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'League matches service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class MatchOddsAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        country = request.query_params.get('countrycode', 'BR')
        cache_key = f"odds_{event_id}_{country}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        try:
            data = sports_api.get_match_odds(event_id, country)
            if data and data.get('status') == 'success':
                res = {'status': 'success', 'data': data}
                cache.set(cache_key, res, 300) # Cache odds for 5 mins
                return Response(res)
            return Response({'status': 'error', 'message': 'No odds'}, status=404)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)

class MatchOddsPollAPIView(APIView):
    """Get odds poll for a specific match - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            data = sports_api.get_match_odds_poll(event_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No odds poll found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Odds poll service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class MatchStatisticsAPIView(APIView):
    """Get match statistics - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            data = sports_api.get_match_statistics(event_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No statistics found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Statistics service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class MatchFirstHalfStatsAPIView(APIView):
    """Get first half match statistics - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            data = sports_api.get_match_first_half_stats(event_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No first half statistics found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'First half statistics service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class MatchSecondHalfStatsAPIView(APIView):
    """Get second half match statistics - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            data = sports_api.get_match_second_half_stats(event_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No second half statistics found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Second half statistics service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class HomeTeamLineupAPIView(APIView):
    """Get home team lineup - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            data = sports_api.get_home_team_lineup(event_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No home team lineup found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Lineup service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class AwayTeamLineupAPIView(APIView):
    """Get away team lineup - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            data = sports_api.get_away_team_lineup(event_id)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No away team lineup found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Lineup service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class TrendingNewsAPIView(APIView):
    """Get trending football news - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            data = sports_api.get_trending_news()
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': 'No trending news available'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'News service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class LeagueNewsAPIView(APIView):
    """Get league news - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, league_id):
        page = request.query_params.get('page', 1)
        
        try:
            data = sports_api.get_league_news(league_id, page)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No news found for league ID: {league_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'League news service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class TeamNewsAPIView(APIView):
    """Get team news - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, team_id):
        page = request.query_params.get('page', 1)
        
        try:
            data = sports_api.get_team_news(team_id, page)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No news found for team ID: {team_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Team news service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


class SearchPlayersAPIView(APIView):
    """Search players from external API - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        search_term = request.query_params.get('search', '')
        
        if not search_term:
            return Response({
                'status': 'error',
                'message': 'Search term is required'
            }, status=400)
        
        try:
            data = sports_api.search_players(search_term)
            
            if data and data.get('status') == 'success':
                # Format the response for frontend
                formatted_data = self.format_player_data(data)
                return Response({
                    'status': 'success',
                    'data': formatted_data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No players found for: {search_term}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Player search service is currently unavailable.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def format_player_data(self, data):
        """Format player data for frontend display"""
        if not data.get('response'):
            return []
        
        formatted = []
        suggestions = data['response'].get('suggestions', [])
        
        for player in suggestions:
            formatted.append({
                'id': player.get('id'),
                'name': player.get('name'),
                'team': player.get('teamName', 'Free Agent'),
                'teamId': player.get('teamId'),
                'type': player.get('type'),
                'isCoach': player.get('isCoach', False),
                'score': player.get('score')
            })
        
        return formatted


class APIBackendHealthCheck(APIView):
    """Check if external API is responding"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Try a simple endpoint that should respond quickly
            url = f"{sports_api.base_url}/football-popular-leagues"
            response = requests.get(
                url, 
                headers=sports_api.headers, 
                timeout=5
            )
            
            if response.status_code == 200:
                return Response({
                    'status': 'healthy',
                    'response_time': response.elapsed.total_seconds()
                })
            else:
                return Response({
                    'status': 'unhealthy',
                    'status_code': response.status_code
                }, status=503)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'unhealthy',
                'error': 'Timeout'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': str(e)
            }, status=503)


class LiveMatchesAPIView(APIView):
    """Get current live matches - Heavy Caching for Performance"""
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = "api_live_matches_clean"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data, status=200)

        try:
            matches = sports_api.get_live_matches()
            # Cache for 30-60 seconds to prevent overlapping requests
            cache.set(cache_key, matches, 60)
            return Response(matches, status=200)
        except Exception:
            return Response([], status=200)
        
class MatchDetailView(APIView):
    def get(self, request, match_id):
        # 1. Try to find local data first
        # match = Match.objects.filter(external_id=match_id).first()
        
        # 2. If not found or if you want fresh live data:
        external_data = sports_api.get_odds('upcoming') # Or a specific league
        
        # Find the specific match in the list
        match_data = next((m for m in external_data if m['id'] == match_id), None)
        
        if not match_data:
            return Response({"error": "Match not found"}, status=404)
            
        return Response(match_data)


class AvailableSportsAPIView(APIView):
    """List all available sports/leagues in-season"""
    permission_classes = [AllowAny]

    def get(self, request):
        data = sports_api.get_all_active_sports()
        return Response({"status": "success", "data": data})

class LeagueOddsAPIView(APIView):
    """
    Production-ready view to fetch and clean odds data with caching.
    """
    def get(self, request, league_id):
        # 1. Database Lookup
        league = get_object_or_404(League, id=league_id)
        
        if not league.external_key:
            return Response(
                {"error": "League mapping missing"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Cache Check (Avoid unnecessary API hits)
        cache_key = f"odds_{league.external_key}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)

        # 3. External API Call with Error Handling
        try:
            raw_data = sports_api.get_odds(league.external_key)
        except Exception as e:
            logger.error(f"External API Error for {league.name}: {str(e)}")
            return Response(
                {"error": "Service temporarily unavailable"}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # 4. Refined Data Processing
        refined_matches = []
        for match in raw_data:
            # Logic: We take the first bookmaker as the primary source
            # You can later expand this to take the best price across all bookies
            odds_entry = {}
            if match.get('bookmakers'):
                primary_bookie = match['bookmakers'][0]
                h2h_market = next(
                    (m for m in primary_bookie.get('markets', []) if m['key'] == 'h2h'), 
                    None
                )
                
                if h2h_market:
                    for outcome in h2h_market['outcomes']:
                        odds_entry[outcome['name']] = outcome['price']

            refined_matches.append({
                "match_id": match['id'],
                "home_team": match['home_team'],
                "away_team": match['away_team'],
                "commence_time": match['commence_time'],
                "odds": odds_entry,
                "bookmaker": primary_bookie.get('title') if match.get('bookmakers') else None
            })

        response_payload = {
            "league_name": league.name,
            "last_updated": "Live",
            "matches": refined_matches
        }

        # 5. Save to Cache (Expire in 5 minutes / 300 seconds)
        # Betting odds change frequently, so don't cache for too long
        cache.set(cache_key, response_payload, timeout=300)

        return Response(response_payload)
    
class LiveScoresAPIView(APIView):
    """Get live scores for a sport (e.g., GET /api/scores/soccer_epl/)"""
    permission_classes = [AllowAny]

    def get(self, request, sport_key=None):
        # 1. Capture the key from URL path or the 'all' default from urls.py
        # 2. If for some reason it's still 'upcoming', force it to 'all'
        target_key = sport_key if sport_key and sport_key != 'upcoming' else 'all'
        
        try:
            # Call your service
            data = sports_api.get_live_scores(target_key)
            return Response({"status": "success", "data": data})
        except Exception as e:
            logger.error(f"Error fetching live scores for {target_key}: {str(e)}")
            return Response({
                "status": "error", 
                "message": "Could not fetch scores from external provider"
            }, status=status.HTTP_502_BAD_GATEWAY)

class APIBackendHealthCheck(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Simply check if we can reach the base sports list
        data = sports_api.get_all_active_sports()
        return Response({
            'status': 'healthy' if data else 'unhealthy',
            'api': 'The Odds API'
        })
    

# The Statistics View (Shots, Possession, etc.)
class MatchStatsView(APIView):
    def get(self, request, match_id):
        # Returning dummy data so the frontend has something to render
        return Response({
            "home_possession": 50,
            "away_possession": 50,
            "home_shots": 0,
            "away_shots": 0,
        })

# The Lineup View
class LineupView(APIView):
    def get(self, request, match_id):
        return Response({
            "home_lineup": [],
            "away_lineup": [],
            "formation": "4-4-2"
        })