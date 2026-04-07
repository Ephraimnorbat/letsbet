from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import requests
from .models import Match, League, Team

@shared_task
def update_live_matches():
    """
    Update live matches from external API
    """
    try:
        # Using API-Football (if you have RapidAPI key)
        # Or use TheSportsDB as fallback
        api_key = 'YOUR_RAPIDAPI_KEY'  # Move to env variable
        url = 'https://api-football-v1.p.rapidapi.com/v3/fixtures'
        
        headers = {
            'X-RapidAPI-Key': api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
        
        params = {
            'live': 'all',
            'timezone': 'Africa/Nairobi'
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            matches = data.get('response', [])
            
            updated_count = 0
            for match_data in matches:
                # Update or create match in database
                fixture = match_data.get('fixture', {})
                teams = match_data.get('teams', {})
                goals = match_data.get('goals', {})
                league_data = match_data.get('league', {})
                
                match_id = fixture.get('id')
                
                # Get or create league
                league, _ = League.objects.get_or_create(
                    external_id=league_data.get('id'),
                    defaults={
                        'name': league_data.get('name', 'Unknown'),
                        'country': league_data.get('country', 'Unknown'),
                        'is_active': True
                    }
                )
                
                # Get or create teams
                home_team, _ = Team.objects.get_or_create(
                    external_id=teams.get('home', {}).get('id'),
                    defaults={
                        'name': teams.get('home', {}).get('name', 'Home Team'),
                        'short_name': teams.get('home', {}).get('name', 'Home')[:50],
                        'league': league
                    }
                )
                
                away_team, _ = Team.objects.get_or_create(
                    external_id=teams.get('away', {}).get('id'),
                    defaults={
                        'name': teams.get('away', {}).get('name', 'Away Team'),
                        'short_name': teams.get('away', {}).get('name', 'Away')[:50],
                        'league': league
                    }
                )
                
                # Determine match status
                status = fixture.get('status', {}).get('short', 'NS')
                if status == '1H' or status == '2H' or status == 'HT':
                    match_status = 'live'
                elif status == 'FT':
                    match_status = 'finished'
                else:
                    match_status = 'scheduled'
                
                # Update or create match
                match, created = Match.objects.update_or_create(
                    id=match_id,
                    defaults={
                        'league': league,
                        'home_team': home_team,
                        'away_team': away_team,
                        'match_date': fixture.get('date', timezone.now()),
                        'status': match_status,
                        'home_score': goals.get('home', 0),
                        'away_score': goals.get('away', 0),
                        'is_active': True
                    }
                )
                updated_count += 1
            
            return f"Updated {updated_count} live matches"
        else:
            return f"Failed to fetch matches: {response.status_code}"
            
    except Exception as e:
        return f"Error updating live matches: {str(e)}"

@shared_task
def update_match_odds(match_id):
    """
    Update odds for a specific match
    """
    try:
        # Implement odds fetching logic here
        # You can use free odds APIs or implement your own
        pass
    except Exception as e:
        return f"Error updating odds for match {match_id}: {str(e)}"

@shared_task
def cleanup_old_matches():
    """
    Clean up old matches (older than 30 days)
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=30)
        old_matches = Match.objects.filter(
            match_date__lt=cutoff_date,
            status='finished'
        )
        count = old_matches.count()
        # Instead of deleting, you might want to archive them
        # old_matches.delete()
        return f"Found {count} old matches to archive"
    except Exception as e:
        return f"Error cleaning up old matches: {str(e)}"