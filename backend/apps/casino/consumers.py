import json
import secrets
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.wallet.models import Wallet, Transaction as WalletTransaction
from .models import CrashGameRound, CrashBet

class CrashGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'crash_game_room'
        self.user = self.scope["user"]

        # Join the global crash game channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Handles actions sent from Next.js Client
        """
        if not self.user.is_authenticated:
            await self.send(text_data=json.dumps({
                'error': 'Unauthorized'
            }))
            return

        data = json.loads(text_data)
        action = data.get('action')

        if action == 'place_bet':
            amount = data.get('amount')
            await self.handle_place_bet(amount)
            
        elif action == 'cashout':
            current_multiplier = data.get('current_multiplier')
            await self.handle_cashout(current_multiplier)

    # --- Core Business Logic Operations via Database Sync ---
    
    @database_sync_to_async
    def handle_place_bet(self, amount):
        try:
            stake = Decimal(str(amount))
            if stake <= 0:
                return

            with transaction.atomic():
                # Fetch active lobby round
                current_round = CrashGameRound.objects.filter(status='lobby').first()
                if not current_round:
                    return

                wallet = Wallet.objects.select_for_update().get(user=self.user)
                if wallet.balance < stake:
                    return

                # Deduct Stake
                wallet.balance -= stake
                wallet.save()

                # Create Crash Bet record
                CrashBet.objects.create(
                    user=self.user,
                    game_round=current_round,
                    stake=stake,
                    status='placed'
                )

                # Log transaction ledger entry
                WalletTransaction.objects.create(
                    user=self.user,
                    amount=stake,
                    transaction_type='debit',
                    status='completed',
                    description=f"Crash Game Bet Round #{current_round.round_number}",
                    reference=f"CRASH-STAKE-{current_round.round_number}-{secrets.token_hex(4).upper()}"
                )
        except Exception as e:
            print(f"Bet Placement Error: {e}")

    @database_sync_to_async
    def handle_cashout(self, current_multiplier):
        try:
            client_mult = Decimal(str(current_multiplier))
            
            with transaction.atomic():
                # Pull current running flight round
                active_round = CrashGameRound.objects.filter(status='running').first()
                if not active_round:
                    return

                # Security check: Ensure server hasn't already crossed the crash point 
                if client_mult >= active_round.crash_point:
                    return 

                # Locate active placed bet
                bet = CrashBet.objects.filter(user=self.user, game_round=active_round, status='placed').select_for_update().first()
                if not bet:
                    return

                payout_val = round(bet.stake * client_mult, 2)

                # Award User Wallet
                wallet = Wallet.objects.select_for_update().get(user=self.user)
                wallet.balance += payout_val
                wallet.total_won += payout_val
                wallet.save()

                # Lock the Bet row state
                bet.status = 'cashed_out'
                bet.cashout_multiplier = client_mult
                bet.payout = payout_val
                bet.cashed_out_at = timezone.now()
                bet.save()

                # Record payout log
                WalletTransaction.objects.create(
                    user=self.user,
                    amount=payout_val,
                    transaction_type='credit',
                    status='completed',
                    description=f"Crash Payout Round #{active_round.round_number} @{client_mult}x",
                    reference=f"CRASH-WIN-{active_round.round_number}-{secrets.token_hex(4).upper()}"
                )
        except Exception as e:
            print(f"Cashout Error: {e}")

    # --- Group Message Event Broadcasters ---
    async def game_state_update(self, event):
        """Receives broadcast updates from the background system loop"""
        await self.send(text_data=json.dumps(event['data']))