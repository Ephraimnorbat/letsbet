from django.core.management.base import BaseCommand
import uuid
from django.db import transaction
from django.utils import timezone
from apps.betting.models import BetSlip, Bet
from apps.matches.services import sports_api
from apps.wallet.models import Wallet, Transaction


class Command(BaseCommand):
    help = 'Settles pending bet slips based on match results from the API'

    def handle(self, *args, **options):
        # 1. 🚀 CHANGED: Query completed/live events instead of 'upcoming' to get final scores
        api_results = sports_api.get_live_scores('live') 
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
                    match_api_id = bet.match.external_id 
                    
                    if match_api_id in completed_matches:
                        match_data = completed_matches[match_api_id]
                        
                        # Use the helper function to determine win/loss
                        is_win = self.evaluate_bet(bet, match_data)
                        
                        bet.status = 'won' if is_win else 'lost'
                        bet.settled_at = timezone.now()
                        
                        # 🚀 Safe fallback evaluation for score formatting 
                        if 'scores' in match_data and len(match_data['scores']) >= 2:
                            bet.result = f"{match_data['scores'][0]['score']}-{match_data['scores'][1]['score']}"
                        else:
                            bet.result = "Settled"
                            
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
                    slip.status = 'won'
                    slip.save()
                    
                    # 1. Update Wallet Balances securely
                    wallet, created = Wallet.objects.get_or_create(user=slip.user)
                    wallet.balance += slip.potential_win
                    wallet.total_won += slip.potential_win 
                    wallet.save()
                    
                    # 2. Create Transaction Record
                    Transaction.objects.create(
                        user=slip.user,
                        amount=slip.potential_win,
                        transaction_type='credit',
                        category='bet_payout', 
                        status='completed',
                        description=f"Payout for Winning Slip #{slip.id}",
                        reference=f"WIN-SLIP-{slip.id}-{uuid.uuid4().hex[:6].upper()}",
                        completed_at=timezone.now()
                    )
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"Slip {slip.id} settled: {slip.potential_win} added and transaction recorded."
                    ))

    def evaluate_bet(self, bet, match_data):
        """
        Determines if a bet won based on 1X2 outcomes.
        Assumes bet.selection is the Team Name or 'Draw'.
        """
        try:
            # Extract scores safely from the API response array matching exact team entities
            home_score = int(next(s['score'] for s in match_data['scores'] if s['name'] == match_data['home_team']))
            away_score = int(next(s['score'] for s in match_data['scores'] if s['name'] == match_data['away_team']))

            # Determine the actual winner name
            if home_score > away_score:
                actual_outcome = match_data['home_team']
            elif away_score > home_score:
                actual_outcome = match_data['away_team']
            else:
                actual_outcome = "Draw"

            return bet.selection == actual_outcome
            
        except (StopIteration, ValueError, KeyError, TypeError):
            self.stdout.write(self.style.ERROR(f"Error parsing scores for match {match_data.get('id')}"))
            return False