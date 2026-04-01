import requests
from django.conf import settings
from django.core.cache import cache
from datetime import datetime
import logging
import time

logger = logging.getLogger(__name__)

class SportsAPIService:
    """Service to fetch data from Free API Live Football Data"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'SPORTS_API_KEY', '5ae0581a6amsh74a5c33144dbea8p18733ajsn23ba349e1ee9')
        self.api_host = getattr(settings, 'SPORTS_API_HOST', 'free-api-live-football-data.p.rapidapi.com')
        self.base_url = getattr(settings, 'SPORTS_API_BASE_URL', 'https://free-api-live-football-data.p.rapidapi.com')
        
        self.headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.api_host,
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, url, params=None, timeout=15, retries=2):
        """Make request with retry logic - no mock fallback"""
        for attempt in range(retries):
            try:
                response = requests.get(
                    url, 
                    headers=self.headers, 
                    params=params, 
                    timeout=timeout
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout on attempt {attempt + 1} for {url}")
                if attempt == retries - 1:
                    raise
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error on attempt {attempt + 1}: {e}")
                if attempt == retries - 1:
                    raise
                time.sleep(1)
        return None
    
    def get_popular_leagues(self):
        """Get popular football leagues"""
        cache_key = 'popular_leagues'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-popular-leagues"
            data = self._make_request(url, timeout=15)
            cache.set(cache_key, data, 86400)
            return data
        except Exception as e:
            logger.error(f"Error fetching popular leagues: {e}")
            raise
    
    def get_all_countries(self):
        """Get all countries with football leagues"""
        cache_key = 'all_countries'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-get-all-countries"
            data = self._make_request(url, timeout=15)
            cache.set(cache_key, data, 86400)
            return data
        except Exception as e:
            logger.error(f"Error fetching countries: {e}")
            raise
    
    def get_live_matches(self):
        cache_key = 'live_matches'
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        try:
            url = f"{self.base_url}/football-current-live"
            data = self._make_request(url, timeout=15)

            if data and data.get('status') == 'success':
                raw_matches = data.get('data', {}).get('response', {}).get('live', [])

                transformed = []

                for match in raw_matches:
                    try:
                        transformed.append({
                            "id": match.get("id"),
                            "home": {
                                "id": match.get("home", {}).get("id"),
                                "name": match.get("home", {}).get("name"),
                                "score": match.get("home", {}).get("score", 0),
                            },
                            "away": {
                                "id": match.get("away", {}).get("id"),
                                "name": match.get("away", {}).get("name"),
                                "score": match.get("away", {}).get("score", 0),
                            },
                            "leagueId": match.get("leagueId"),
                            "status": {
                                "description": match.get("status", {}).get("description"),
                                "code": match.get("status", {}).get("code"),
                            },
                            "time": match.get("time"),
                            "timeTS": match.get("timeTS"),
                            "statusId": match.get("statusId"),
                            "tournamentStage": match.get("tournamentStage"),
                            "eliminatedTeamId": match.get("eliminatedTeamId"),
                        })
                    except Exception as e:
                        logger.warning(f"Error transforming match: {e}")

                cache.set(cache_key, transformed, 30)
                return transformed

            return []

        except Exception as e:
            logger.error(f"Error fetching live matches: {e}")
            return []
    
    def get_matches_by_date(self, date=None):
        """Get matches for a specific date"""
        if not date:
            date = datetime.now().strftime('%Y%m%d')
        
        cache_key = f'matches_by_date_{date}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-get-matches-by-date"
            params = {'date': date}
            
            data = self._make_request(url, params, timeout=15)
            cache.set(cache_key, data, 3600)
            return data
        except Exception as e:
            logger.error(f"Error fetching matches by date {date}: {e}")
            raise
    
    def get_matches_by_league(self, league_id):
        """Get all matches for a specific league"""
        cache_key = f'matches_by_league_{league_id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-get-all-matches-by-league"
            params = {'leagueid': league_id}
            
            data = self._make_request(url, params, timeout=15)
            cache.set(cache_key, data, 21600)
            return data
        except Exception as e:
            logger.error(f"Error fetching matches for league {league_id}: {e}")
            raise
    
    def get_match_odds(self, event_id, countrycode='BR'):
        """Get odds for a specific match"""
        cache_key = f'match_odds_{event_id}_{countrycode}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-event-odds"
            params = {
                'eventid': event_id,
                'countrycode': countrycode
            }
            
            data = self._make_request(url, params, timeout=15)
            
            if data and data.get('status') == 'success':
                cache.set(cache_key, data, 60)
                return data
            else:
                raise Exception("API returned error status for odds")
                
        except Exception as e:
            logger.error(f"Error fetching odds for event {event_id}: {e}")
            raise
    
    def get_match_statistics(self, event_id):
        """Get match statistics"""
        cache_key = f'match_stats_{event_id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-get-match-event-all-stats"
            params = {'eventid': event_id}
            
            data = self._make_request(url, params, timeout=15)
            
            if data and data.get('status') == 'success':
                cache.set(cache_key, data, 30)
                return data
            else:
                raise Exception("API returned error status for statistics")
                
        except Exception as e:
            logger.error(f"Error fetching match statistics: {e}")
            raise
    
    def get_home_team_lineup(self, event_id):
        """Get home team lineup"""
        cache_key = f'home_lineup_{event_id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-get-hometeam-lineup"
            params = {'eventid': event_id}
            
            data = self._make_request(url, params, timeout=15)
            
            if data and data.get('status') == 'success':
                cache.set(cache_key, data, 3600)
                return data
            else:
                raise Exception("API returned error status for lineup")
                
        except Exception as e:
            logger.error(f"Error fetching home team lineup: {e}")
            raise
    
    def get_away_team_lineup(self, event_id):
        """Get away team lineup"""
        cache_key = f'away_lineup_{event_id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-get-awayteam-lineup"
            params = {'eventid': event_id}
            
            data = self._make_request(url, params, timeout=15)
            
            if data and data.get('status') == 'success':
                cache.set(cache_key, data, 3600)
                return data
            else:
                raise Exception("API returned error status for lineup")
                
        except Exception as e:
            logger.error(f"Error fetching away team lineup: {e}")
            raise
    
    def search_players(self, search_term='m'):
        """Search for players"""
        cache_key = f'players_search_{search_term}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            url = f"{self.base_url}/football-players-search"
            params = {'search': search_term}
            
            data = self._make_request(url, params, timeout=15)
            
            if data and data.get('status') == 'success':
                cache.set(cache_key, data, 3600)
                return data
            else:
                raise Exception("API returned error status for player search")
                
        except Exception as e:
            logger.error(f"Error searching players: {e}")
            raise

# Create singleton instance
sports_api = SportsAPIService()