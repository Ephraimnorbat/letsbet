from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.matches.models import Sport, League, Team, Match
from apps.matches.services import sports_api
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sync matches and odds from external API'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--league',
            type=int,
            help='Sync specific league ID'
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Sync matches for specific date (YYYY-MM-DD)'
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Starting sync...')
        
        # Get live matches
        live_matches = sports_api.get_live_matches()
        if live_matches and live_matches.get('response'):
            self.sync_live_matches(live_matches['response'])
        
        # Get fixtures for today
        if options.get('date'):
            date = options['date']
        else:
            date = timezone.now().strftime('%Y-%m-%d')
        
        fixtures = sports_api.get_fixtures_by_date(date)
        if fixtures and fixtures.get('response'):
            self.sync_fixtures(fixtures['response'])
        
        self.stdout.write(self.style.SUCCESS('Sync completed successfully!'))
    
    def sync_live_matches(self, matches_data):
        """Sync live matches data"""
        for match_data in matches_data:
            try:
                # Get or create league
                league_data = match_data['league']
                league, created = League.objects.get_or_create(
                    external_id=league_data['id'],
                    defaults={
                        'name': league_data['name'],
                        'country': league_data['country'],
                        'is_active': True
                    }
                )
                
                # Get or create teams
                home_team_data = match_data['teams']['home']
                away_team_data = match_data['teams']['away']
                
                home_team, _ = Team.objects.get_or_create(
                    external_id=home_team_data['id'],
                    defaults={
                        'name': home_team_data['name'],
                        'short_name': home_team_data['name'][:50],
                        'league': league
                    }
                )
                
                away_team, _ = Team.objects.get_or_create(
                    external_id=away_team_data['id'],
                    defaults={
                        'name': away_team_data['name'],
                        'short_name': away_team_data['name'][:50],
                        'league': league
                    }
                )
                
                # Get or update match
                match, created = Match.objects.update_or_create(
                    external_id=match_data['fixture']['id'],
                    defaults={
                        'league': league,
                        'home_team': home_team,
                        'away_team': away_team,
                        'match_date': match_data['fixture']['date'],
                        'status': match_data['fixture']['status']['short'],
                        'home_score': match_data['goals']['home'] or 0,
                        'away_score': match_data['goals']['away'] or 0,
                    }
                )
                
                # Sync odds
                self.sync_match_odds(match)
                
            except Exception as e:
                logger.error(f"Error syncing match: {e}")
    
    def sync_fixtures(self, fixtures_data):
        """Sync upcoming fixtures"""
        for fixture_data in fixtures_data:
            try:
                # Similar logic to sync_matches but for upcoming matches
                league_data = fixture_data['league']
                league, _ = League.objects.get_or_create(
                    external_id=league_data['id'],
                    defaults={
                        'name': league_data['name'],
                        'country': league_data['country'],
                        'is_active': True
                    }
                )
                
                home_team_data = fixture_data['teams']['home']
                away_team_data = fixture_data['teams']['away']
                
                home_team, _ = Team.objects.get_or_create(
                    external_id=home_team_data['id'],
                    defaults={
                        'name': home_team_data['name'],
                        'short_name': home_team_data['name'][:50],
                        'league': league
                    }
                )
                
                away_team, _ = Team.objects.get_or_create(
                    external_id=away_team_data['id'],
                    defaults={
                        'name': away_team_data['name'],
                        'short_name': away_team_data['name'][:50],
                        'league': league
                    }
                )
                
                Match.objects.update_or_create(
                    external_id=fixture_data['fixture']['id'],
                    defaults={
                        'league': league,
                        'home_team': home_team,
                        'away_team': away_team,
                        'match_date': fixture_data['fixture']['date'],
                        'status': fixture_data['fixture']['status']['short'],
                    }
                )
                
            except Exception as e:
                logger.error(f"Error syncing fixture: {e}")
    
    def sync_match_odds(self, match):
        """Sync odds for a specific match"""
        odds_data = sports_api.get_match_odds(match.external_id)
        
        if odds_data and odds_data.get('response'):
            for odd in odds_data['response']:
                if odd.get('bookmakers'):
                    # Get the first bookmaker (e.g., Bet365)
                    bookmaker = odd['bookmakers'][0]
                    for bet in bookmaker.get('bets', []):
                        if bet.get('name') == 'Match Winner':
                            for value in bet.get('values', []):
                                if value.get('value') == 'Home':
                                    match.home_odds = float(value.get('odd', 0))
                                elif value.get('value') == 'Draw':
                                    match.draw_odds = float(value.get('odd', 0))
                                elif value.get('value') == 'Away':
                                    match.away_odds = float(value.get('odd', 0))
                            
                            match.save()
                            break