import requests
from django.conf import settings
from django.core.cache import cache
import logging
from decouple import config # or your preferred env loader

logger = logging.getLogger(__name__)

class SportsAPIService:
    def __init__(self):
        self.api_key = config('ODDS_API_KEY')
        # Ensure your ODDS_API_BASE_URL in .env is: https://api.the-odds-api.com/v4/sports
        self.base_url = config('ODDS_API_BASE_URL').rstrip('/')

    def _make_request(self, endpoint, params=None):
        # Ensure we don't end up with double slashes
        clean_endpoint = endpoint.lstrip('/')
        url = f"{self.base_url}/{clean_endpoint}"
        
        query_params = {'apiKey': self.api_key}
        if params:
            query_params.update(params)

        try:
            response = requests.get(url, params=query_params, timeout=10)
            # Log the full URL for debugging (useful to see exactly what's failing)
            logger.info(f"Requesting: {response.url}")
            
            response.raise_for_status()
            
            remaining = response.headers.get('x-requests-remaining')
            logger.info(f"Credits Remaining: {remaining}")
            
            return response.json()
        except Exception as e:
            logger.error(f"The Odds API Request Error: {e}")
            return None

    def get_all_active_sports(self):
        """Returns a list of all in-season sports/leagues."""
        cache_key = "odds_api_active_sports"
        cached = cache.get(cache_key)
        if cached: return cached

        data = self._make_request("") # Base endpoint lists sports
        if data:
            cache.set(cache_key, data, 86400) # Sports list rarely changes (24h)
            return data
        return []

    def get_odds(self, sport_key, region='uk', markets='h2h'):
        """Fetch odds for a specific league (e.g., 'soccer_epl')"""
        cache_key = f"odds_{sport_key}_{region}_{markets}"
        cached = cache.get(cache_key)
        if cached: return cached

        params = {
            'regions': region,
            'markets': markets,
            'oddsFormat': 'decimal'
        }
        data = self._make_request(f"{sport_key}/odds", params=params)
        if data:
            # IMPORTANT: Caching for 30 mins to save your 500 credits!
            cache.set(cache_key, data, 1800) 
            return data
        return []

  

    def get_live_scores(self, sport_key):
        """
        Hybrid Fix: The /scores endpoint is too restrictive.
        If 'upcoming' or 'soccer' is passed, we use the /odds endpoint 
        which includes live games across all sports.
        """
        # 1. Standardize the key
        if not sport_key or sport_key in ['all', 'upcoming', 'soccer']:
            # We call our own get_odds method with the 'upcoming' key
            # This returns live games + next 8 upcoming games across ALL sports
            return self.get_odds('upcoming')

        # 2. If a specific league key is provided (e.g., 'soccer_epl'), 
        # we can use the scores endpoint safely.
        cache_key = f"scores_{sport_key}"
        cached = cache.get(cache_key)
        if cached: 
            return cached

        data = self._make_request(f"{sport_key}/scores", params={'daysFrom': 1})
        if data:
            cache.set(cache_key, data, 300)
            return data
        return []
sports_api = SportsAPIService()