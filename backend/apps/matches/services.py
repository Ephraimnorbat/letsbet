import requests
import logging
from decouple import config
from django.core.cache import cache

logger = logging.getLogger(__name__)

class SportsAPIService:
    def __init__(self):
        self.api_key = config('ODDS_API_KEY', default='')
        self.base_url = "https://api.the-odds-api.com/v4/sports"
        
        # ✅ Valid sport keys that support odds
        self.valid_odds_sports = [
            'soccer_epl',                    # ✅ Premier League
            'soccer_spain_la_liga',          # ✅ La Liga
            'soccer_germany_bundesliga',     # ✅ Bundesliga
            'soccer_italy_serie_a',          # ✅ Serie A
            'soccer_france_ligue_one',       # ✅ Ligue 1
            'soccer_netherlands_eredivisie',
            'soccer_uefa_champs_league',
            'soccer_portugal_primeira_liga',
            'soccer_brazil_campeonato',
            'soccer_usa_mls',
            'basketball_nba',                # ✅ NBA
            'basketball_euroleague',
            'basketball_ncaab',
            'americanfootball_nfl',          # ✅ NFL
            'americanfootball_ncaaf',
            'icehockey_nhl',                 # ✅ NHL
            'baseball_mlb',                  # ✅ MLB
            'tennis_atp',
            'tennis_wta',
            'mma_mixed_martial_arts',
            'boxing_boxing',
            'rugby_union',
            'cricket_big_bash',
            'cricket_ipl',
        ]
        
        # ✅ Invalid keys that should be skipped
        self.invalid_odds_keys = [
            'americanfootball_ncaaf_championship_winner',
            'americanfootball_nfl_championship_winner',
            'basketball_nba_championship_winner',
            'soccer_fifa_world_cup_winner',
            'tennis_atp_finals_winner',
        ]

    def _make_request(self, endpoint, params=None):
        if not self.api_key:
            logger.error("❌ ODDS_API_KEY is missing from .env!")
            return None

        endpoint = endpoint.lstrip('/')
        url = f"{self.base_url}/{endpoint}"
        
        query_params = {'apiKey': self.api_key}
        if params:
            query_params.update(params)

        try:
            response = requests.get(url, params=query_params, timeout=15)
            
            # ✅ Handle 422 errors gracefully
            if response.status_code == 422:
                logger.warning(f"API returned 422 for endpoint: {endpoint}")
                return []
            
            response.raise_for_status()
            
            remaining = response.headers.get('x-requests-remaining')
            if remaining:
                logger.info(f"API Quota Remaining: {remaining}")
                
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 422:
                logger.warning(f"422 Unprocessable Entity for {endpoint}")
                return []
            logger.error(f"The Odds API HTTP Error: {e}")
            return None
        except Exception as e:
            logger.error(f"The Odds API Error: {e}")
            return None

    def get_all_active_sports(self):
        """Fetches all currently available sports and leagues."""
        cache_key = "active_sports_list"
        cached = cache.get(cache_key)
        if cached: 
            return cached

        data = self._make_request("")
        if data:
            cache.set(cache_key, data, 86400)  # 24 hours
        return data if data else []  # ✅ Always return a list

    def get_live_scores(self, sport_key='upcoming'):
        """Fetches live scores with current goals for ongoing matches."""
        # ✅ Skip invalid keys
        if sport_key in self.invalid_odds_keys:
            return []
            
        api_sport_key = 'soccer_epl' if sport_key == 'upcoming' else sport_key
        
        cache_key = f"live_scores_{api_sport_key}"
        cached = cache.get(cache_key)
        if cached: 
            return cached

        params = {'daysFrom': 1}
        data = self._make_request(f"{api_sport_key}/scores", params=params)
        
        if data:
            cache.set(cache_key, data, 30)
        return data if data else []  # ✅ Always return a list

    def get_odds(self, sport_key):
        """
        Fetches full market odds.
        """
        # ✅ Skip invalid keys
        if sport_key in self.invalid_odds_keys:
            logger.info(f"Skipping invalid odds key: {sport_key}")
            return []
        
        # ✅ Default to a valid key
        api_sport_key = 'soccer_epl' if sport_key == 'upcoming' else sport_key
        
        # ✅ Check if sport supports odds
        if api_sport_key not in self.valid_odds_sports:
            logger.info(f"Sport {api_sport_key} not in valid odds list, attempting anyway...")
        
        return self.get_upcoming_matches(api_sport_key)

    def get_upcoming_matches(self, sport_key='soccer_epl'):
        """Fetches and formats matches for the frontend."""
        # ✅ Skip invalid keys
        if sport_key in self.invalid_odds_keys:
            return []
        
        # ✅ If 'upcoming' is passed, default to soccer_epl
        if sport_key == 'upcoming' or sport_key is None:
            api_sport_key = 'soccer_epl'
        else:
            api_sport_key = sport_key
        
        # ✅ Check if the sport key is valid
        if api_sport_key not in self.valid_odds_sports:
            logger.warning(f"Sport key {api_sport_key} is not in valid odds list")
            return []
        
        cache_key = f"formatted_matches_{api_sport_key}"
        cached = cache.get(cache_key)
        if cached: 
            return cached

        params = {
            'regions': 'eu',
            'markets': 'h2h',
            'oddsFormat': 'decimal'
        }
        
        data = self._make_request(f"{api_sport_key}/odds", params=params)
        
        if not data:
            return []

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

    def get_valid_odds_sports(self):
        """Returns the list of sports that support odds."""
        return self.valid_odds_sports

# ✅ Singleton instance
sports_api = SportsAPIService()