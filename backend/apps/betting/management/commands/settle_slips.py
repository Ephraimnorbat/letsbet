from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.betting.models import BetSlip, Bet
from apps.matches.services import sports_api
from apps.wallet.models import Wallet 

class Command(BaseCommand):
    help = 'Settles pending bet slips based on match results from the API'

    def handle(self, *args, **options):
        # 1. Fetch recently completed matches from the Odds API
        # This returns scores and the 'completed' status
        api_results = sports_api.get_live_scores('upcoming')
        if not api_results:
            self.stdout.write(self.style.WARNING("No match data received from API."))
            return

        # Map by external_id for quick lookup
        completed_matches = {m['id']: m for m in api_results if m.get('completed')}

        # 2. Get all pending slips and their selections
        pending_slips = BetSlip.objects.filter(status='pending').prefetch_related('selections__match')

        if not pending_slips.exists():
            self.stdout.write("No pending slips to process.")
            return

        for slip in pending_slips:
            with transaction.atomic():
                all_bets_settled = True
                slip_lost = False

                for bet in slip.selections.filter(status='pending'):
                    # Use 'external_id' from your Match model
                    match_api_id = bet.match.external_id 
                    
                    if match_api_id in completed_matches:
                        match_data = completed_matches[match_api_id]
                        
                        # Use the helper function to determine win/loss
                        is_win = self.evaluate_bet(bet, match_data)
                        
                        bet.status = 'won' if is_win else 'lost'
                        bet.settled_at = timezone.now()
                        bet.result = f"{match_data['scores'][0]['score']}-{match_data['scores'][1]['score']}"
                        bet.save()

                        if not is_win:
                            slip_lost = True
                    else:
                        # Match isn't completed in the API yet
                        all_bets_settled = False

                # 3. Update Slip Status
                if slip_lost:
                    slip.status = 'lost'
                    slip.save()
                    self.stdout.write(self.style.ERROR(f"Slip {slip.id} marked as LOST"))
                
                elif all_bets_settled:
                    # Every single selection in this slip won
                    slip.status = 'won'
                    slip.save()
                    
                    # Payout: Update user wallet
                    wallet, created = Wallet.objects.get_or_create(user=slip.user)
                    wallet.balance += slip.potential_win
                    wallet.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"Slip {slip.id} WON! KSh {slip.potential_win} added to {slip.user.username}'s wallet."
                    ))

    def evaluate_bet(self, bet, match_data):
        """
        Determines if a bet won based on 1X2 outcomes.
        Assumes bet.selection is the Team Name or 'Draw'.
        """
        try:
            # Extract scores safely from the API response
            home_score = int(next(s['score'] for s in match_data['scores'] if s['name'] == match_data['home_team']))
            away_score = int(next(s['score'] for s in match_data['scores'] if s['name'] == match_data['away_team']))

            # Determine the actual winner name
            if home_score > away_score:
                actual_outcome = match_data['home_team']
            elif away_score > home_score:
                actual_outcome = match_data['away_team']
            else:
                actual_outcome = "Draw"

            # Check if user's selection matches the actual outcome
            return bet.selection == actual_outcome
            
        except (StopIteration, ValueError, KeyError):
            self.stdout.write(self.style.ERROR(f"Error parsing scores for match {match_data.get('id')}"))
            return False