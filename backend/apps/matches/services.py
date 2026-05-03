import requests
import logging
from decouple import config
from django.core.cache import cache

logger = logging.getLogger(__name__)

class SportsAPIService:
    def __init__(self):
        self.api_key = config('ODDS_API_KEY', default='')
        self.base_url = "https://api.the-odds-api.com/v4/sports"

    def _make_request(self, endpoint, params=None):
        if not self.api_key:
            logger.error("❌ ODDS_API_KEY is missing from .env!")
            return None

        # Clean endpoint handling
        endpoint = endpoint.lstrip('/')
        url = f"{self.base_url}/{endpoint}"
        
        query_params = {'apiKey': self.api_key}
        if params:
            query_params.update(params)

        try:
            response = requests.get(url, params=query_params, timeout=15)
            response.raise_for_status()
            
            # The Odds API returns remaining requests in headers - useful for logging
            remaining = response.headers.get('x-requests-remaining')
            if remaining:
                logger.info(f"API Quota Remaining: {remaining}")
                
            return response.json()
        except Exception as e:
            logger.error(f"The Odds API Error: {e}")
            return None

    def get_all_active_sports(self):
        """Fetches all currently available sports and leagues."""
        cache_key = "active_sports_list"
        cached = cache.get(cache_key)
        if cached: return cached

        data = self._make_request("") # Base URL + empty endpoint returns all sports
        if data:
            cache.set(cache_key, data, 86400) # Cache for 24 hours as this rarely changes
        return data if data else []

    def get_live_scores(self, sport_key='upcoming'):
            """Fetches live scores with current goals for ongoing matches."""
            # ✅ FIX: The Odds API doesn't have a 'upcoming' sport. 
            # Default to a valid key if 'upcoming' is passed from the frontend.
            api_sport_key = 'soccer_epl' if sport_key == 'upcoming' else sport_key
            
            cache_key = f"live_scores_{api_sport_key}"
            cached = cache.get(cache_key)
            if cached: return cached

            params = {'daysFrom': 1} 
            data = self._make_request(f"{api_sport_key}/scores", params=params)
            
            if data:
                cache.set(cache_key, data, 30) 
            return data if data else []

    def get_odds(self, sport_key):
        """
        Fetches full market odds. 
        Note: The Odds API uses the /odds endpoint for both upcoming and current odds.
        """
        # We can reuse your formatted upcoming logic here
        return self.get_upcoming_matches(sport_key)

    def get_upcoming_matches(self, sport_key='soccer_epl'):
        """Fetches and formats matches for the frontend."""
        # Fix: Ensure we don't pass 'upcoming' as a literal sport_key to the API
        api_sport_key = 'soccer_epl' if sport_key == 'upcoming' else sport_key
        
        cache_key = f"formatted_matches_{api_sport_key}"
        cached = cache.get(cache_key)
        if cached: return cached

        params = {
            'regions': 'eu',
            'markets': 'h2h',
            'oddsFormat': 'decimal'
        }
        
        data = self._make_request(f"{api_sport_key}/odds", params=params)
        
        if not data: return []

        formatted = []
        for game in data:
            formatted.append({
                "id": game.get("id"),
                "home_team": game.get("home_team"),
                "away_team": game.get("away_team"),
                "commence_time": game.get("commence_time"),
                "sport_title": game.get("sport_title"),
                "bookmakers": game.get("bookmakers", [])
            })

        cache.set(cache_key, formatted, 600) 
        return formatted

sports_api = SportsAPIService()