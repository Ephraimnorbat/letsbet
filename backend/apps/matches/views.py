from rest_framework import generics, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Sport, League, Team, Match, MatchEvent
from .serializers import (
    SportSerializer, LeagueSerializer, TeamSerializer,
    MatchSerializer, MatchListSerializer, LiveMatchSerializer
)
from .services import sports_api
import requests

# ============= LOCAL DATABASE VIEWS =============

class SportViewSet(viewsets.ModelViewSet):
    queryset = Sport.objects.filter(is_active=True)
    serializer_class = SportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class LeagueViewSet(viewsets.ModelViewSet):
    queryset = League.objects.filter(is_active=True)
    serializer_class = LeagueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['sport', 'country']
    search_fields = ['name']

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
    """Get popular football leagues - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            data = sports_api.get_popular_leagues()
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': 'No leagues data available from API'
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
    """Get matches by date - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        date = request.query_params.get('date')
        
        try:
            data = sports_api.get_matches_by_date(date)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No matches found for date: {date or "today"}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Matches service is currently unavailable. Please try again.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


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
    """Get odds for a specific match - Real data only"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        countrycode = request.query_params.get('countrycode', 'BR')
        
        try:
            data = sports_api.get_match_odds(event_id, countrycode)
            
            if data and data.get('status') == 'success':
                return Response({
                    'status': 'success',
                    'data': data
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'No odds found for match ID: {event_id}'
                }, status=404)
                
        except requests.exceptions.Timeout:
            return Response({
                'status': 'error',
                'message': 'Odds service is currently unavailable. Please try again.'
            }, status=503)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)


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
    """Get current live matches - Clean response for frontend"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            matches = sports_api.get_live_matches()

            # ✅ Always return array
            return Response(matches, status=200)

        except requests.exceptions.Timeout:
            return Response([], status=200)

        except Exception as e:
            return Response([], status=200)