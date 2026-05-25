import time
import math
import secrets
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.casino.models import CrashGameRound, CrashBet

class Command(BaseCommand):
    help = "Drives the continuous real-time execution loop for the Crash Game"

    def handle(self, *args, **options):
        self.channel_layer = get_channel_layer()
        self.room_group_name = 'crash_game_room'
        self.stdout.write(self.style.SUCCESS("Crash Game Engine Initialized..."))

        while True:
            try:
                self._run_game_cycle()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Engine Loop Error: {e}"))
                time.sleep(2) # Prevent rapid log spamming if DB connection drops

    def _run_game_cycle(self):
        # 1. INITIALIZE A NEW ROUND IN LOBBY STATE
        crash_point = self._calculate_provably_fair_crash()
        next_round_num = self._get_next_round_number()

        game_round = CrashGameRound.objects.create(
            round_number=next_round_num,
            crash_point=crash_point,
            status='lobby'
        )

        # 2. LOBBY COUNTDOWN PHASE (10 Seconds)
        lobby_duration = 10
        for remaining in range(lobby_duration, 0, -1):
            self._broadcast({
                'type': 'game_state_update',
                'data': {
                    'status': 'lobby',
                    'round_number': game_round.round_number,
                    'countdown': remaining,
                }
            })
            time.sleep(1)

        # 3. FLIGHT TICK PHASE (Exponential climbing)
        game_round.status = 'running'
        game_round.started_at = timezone.now()
        game_round.save()

        start_time = time.time()
        current_multiplier = Decimal('1.00')

        while current_multiplier < crash_point:
            elapsed = time.time() - start_time
            
            # Exponential growth formula: x = 1.06^(elapsed seconds)
            # This makes the plane climb faster the longer it survives
            calculated_mult = math.pow(1.06, elapsed)
            current_multiplier = Decimal(str(min(round(calculated_mult, 2), float(crash_point))))

            self._broadcast({
                'type': 'game_state_update',
                'data': {
                    'status': 'running',
                    'round_number': game_round.round_number,
                    'multiplier': float(current_multiplier)
                }
            })
            
            # 100ms interval ticks (10 updates per second for super smooth UI)
            time.sleep(0.1)

        # 4. CRASH STATE & SETTLEMENT PHASE (5 Seconds)
        game_round.status = 'crashed'
        game_round.ended_at = timezone.now()
        game_round.save()

        # Mark all un-cashed bets in this round as Lost
        self._settle_lost_bets(game_round)

        self._broadcast({
            'type': 'game_state_update',
            'data': {
                'status': 'crashed',
                'round_number': game_round.round_number,
                'crash_point': float(crash_point)
            }
        })
        
        time.sleep(5) # Let the crash visual settle on user screens

    # --- Worker Core Methods ---

    def _calculate_provably_fair_crash(self):
        """Generates the exact math limit using cryptographically secure numbers."""
        # 3% chance the plane explodes instantly right at the start line (1.00x)
        if secrets.randbelow(100) < 3:
            return Decimal('1.00')
        
        # 97% fair mathematical exponential curve distribution mapping
        e = secrets.randbelow(1000000) / 1000000.0
        multiplier = 0.97 / (1.0 - e)
        return Decimal(str(min(round(multiplier, 2), 1000.00)))

    def _get_next_round_number(self):
        last_round = CrashGameRound.objects.order_by('-round_number').first()
        return (last_round.round_number + 1) if last_round else 1

    def _settle_lost_bets(self, game_round):
        """Mass transitions any remaining active bets to Lost in a clean atomic transaction."""
        with transaction.atomic():
            CrashBet.objects.filter(
                game_round=game_round, 
                status='placed'
            ).update(status='lost')

    def _broadcast(self, message):
        """Pushes real-time messages directly into the global Django Channel layer."""
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            message
        )