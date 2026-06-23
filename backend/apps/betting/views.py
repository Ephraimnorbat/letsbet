from rest_framework import generics, status, viewsets
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils import timezone
from django.db.models import F
from rest_framework.views import APIView
import requests
from django.conf import settings
from django.core.cache import cache
from django.utils.timezone import now
from django.db import transaction
from django.db.models import F
from django.utils.timezone import now
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError


from apps.wallet.models import Wallet, Transaction
from apps.matches.models import Match, League, Team
from .models import Bet, BetSlip, BetType, SharedBetslip
from .serializers import BetSerializer, CreateBetSerializer, BetSlipSerializer, BetTypeSerializer, BetSlipHistorySerializer


class BetTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BetType.objects.filter(is_active=True)
    serializer_class = BetTypeSerializer
    permission_classes = [IsAuthenticated]

class PlaceBetView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        selections_data = request.data.get('selections', [])
        
        try:
            stake = float(request.data.get('stake', 0))
        except (ValueError, TypeError):
            return Response({"error": "Invalid stake amount"}, status=status.HTTP_400_BAD_REQUEST)

        if not selections_data:
            return Response({"error": "No selections provided"}, status=status.HTTP_400_BAD_REQUEST)

        if stake <= 0:
            return Response({"error": "Stake must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        # 🛑 BUG FIX 1: Prevent duplicate games in the same bet slip
        seen_match_ids = set()
        for s in selections_data:
            match_id = s.get('matchId')
            if not match_id:
                return Response({"error": "Missing matchId in selections"}, status=status.HTTP_400_BAD_REQUEST)
            if match_id in seen_match_ids:
                return Response({"error": "You cannot add the same match to a betslip more than once"}, status=status.HTTP_400_BAD_REQUEST)
            seen_match_ids.add(match_id)

        # 🛑 BUG FIX 2: Strict Wallet Check (Prevents going into negative balances)
        # select_for_update() locks the wallet row until the request finishes, preventing race conditions
        wallet = Wallet.objects.select_for_update().get(user=request.user)
        if wallet.balance < stake:
            return Response({"error": "Insufficient balance to place this bet"}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total odds
        total_odds = 1.0
        try:
            for s in selections_data:
                total_odds *= float(s['odds'])
        except (ValueError, TypeError):
            return Response({"error": "Invalid odds provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create Master BetSlip
        master_slip = BetSlip.objects.create(
            user=request.user,
            total_stake=stake,
            total_odds=total_odds,
            potential_win=stake * total_odds,
            status='pending'
        )

        # Dynamic Database Seeding Fallbacks
        default_bet_type, _ = BetType.objects.get_or_create(
            id=1,
            defaults={
                'name': 'Standard Bet',
                'description': 'Regular match selection bet',
                'is_active': True
            }
        )

        default_sport, _ = Team.objects.model._meta.get_field('league').related_model._meta.get_field('sport').related_model.objects.get_or_create(
            id=1,
            defaults={
                'name': 'Soccer',
                'is_active': True
            }
        )

        # Link Selections
        for sel in selections_data:
            league_obj, _ = League.objects.get_or_create(
                name="General League",
                defaults={'sport': default_sport}
            )

            match_name = sel.get('matchName', 'Home vs Away')
            teams = match_name.split(' vs ')
            home_name = teams[0].strip()
            away_name = teams[1].strip() if len(teams) > 1 else "Away Team"

            home_team_obj, _ = Team.objects.get_or_create(name=home_name, defaults={'league': league_obj})
            away_team_obj, _ = Team.objects.get_or_create(name=away_name, defaults={'league': league_obj})

            match_obj, _ = Match.objects.get_or_create(
                external_id=sel['matchId'],
                defaults={
                    'league': league_obj,
                    'home_team': home_team_obj,
                    'away_team': away_team_obj,
                    'match_date': now(),
                    'status': 'scheduled'
                }
            )

            Bet.objects.create(
                slip=master_slip,
                user=request.user,
                match=match_obj,
                selection=sel['selection'],
                odds=sel['odds'],
                bet_type=default_bet_type,
                stake=stake,
                status='pending'
            )

        # Deduct wallet securely 
        wallet.balance -= stake
        wallet.save()

        # Record explicit transaction history
        Transaction.objects.create(
            user=request.user,
            amount=stake,
            transaction_type='debit',
            status='completed',
            description=f"Bet placed for Slip #{master_slip.id}",
            reference=f"BET-SLIP-{master_slip.id}"
        )

        # Update User Stats counter
        request.user.total_bets = F('total_bets') + 1
        request.user.save(update_fields=['total_bets'])

        return Response({"message": "Slip placed!", "slip_id": master_slip.id}, status=status.HTTP_201_CREATED)

class MyBetsView(generics.ListAPIView):
    # ✅ Swapped to your custom master card serializer
    serializer_class = BetSlipHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 1. Query the BetSlip model instead of the individual Bet model
        # 2. Prefetch 'selections' (related_name on your Bet model) and deeply prefetch teams/leagues to keep queries fast
        return BetSlip.objects.filter(user=self.request.user)\
            .prefetch_related(
                'selections__match__home_team', 
                'selections__match__away_team',
                'selections__match__league'
            )\
            .order_by('-created_at')

class PendingBetsView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user, status='pending').order_by('-created_at')

class BetHistoryView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(
            user=self.request.user
        ).exclude(status='pending').order_by('-settled_at')

class CashoutBetView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, bet_id):
        try:
            bet = Bet.objects.get(id=bet_id, user=request.user, status='pending')
            
            # Calculate cashout amount (70% of potential win)
            cashout_amount = bet.potential_win * 0.7
            
            # Update bet status
            bet.status = 'cashed_out'
            bet.save()
            
            # Refund to wallet
            wallet = request.user.wallet
            wallet.balance = F('balance') + cashout_amount
            wallet.save()
            wallet.refresh_from_db()
            
            # Create transaction record
            Transaction.objects.create(
                user=request.user,
                amount=cashout_amount,
                transaction_type='credit',
                description=f"Cashout for bet {bet.id}",
                reference=f"CASHOUT_{bet.id}"
            )
            
            return Response({
                'message': 'Bet cashed out successfully',
                'cashout_amount': cashout_amount
            })
            
        except Bet.DoesNotExist:
            return Response({'error': 'Bet not found'}, status=status.HTTP_404_NOT_FOUND)

class ParlayBetView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        bets_data = request.data.get('bets', [])
        total_stake = request.data.get('total_stake', 0)
        
        if len(bets_data) < 2:
            return Response({'error': 'Parlay must have at least 2 bets'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate total odds
        total_odds = 1
        for bet_data in bets_data:
            total_odds *= float(bet_data['odds'])
        
        potential_win = total_stake * total_odds
        parlay_id = f"PARLAY_{timezone.now().timestamp()}"

        wallet = request.user.wallet
        wallet.refresh_from_db()

        if wallet.balance < total_stake:
            return Response({'error': 'Insufficient balance'}, status=400)

        # Deduct first
        wallet.balance = F('balance') - total_stake
        wallet.save()
        wallet.refresh_from_db()
        
        # Create individual bets
        bets = []
        for bet_data in bets_data:
            bet = Bet.objects.create(
                user=request.user,
                match_id=bet_data['match_id'],
                bet_type_id=bet_data['bet_type_id'],
                selection=bet_data['selection'],
                odds=bet_data['odds'],
                stake=total_stake,
                potential_win=potential_win,
                is_parlay=True,
                parlay_id=parlay_id
            )
            bets.append(bet)
        
        # Deduct total stake from wallet
        # 🔥 SAFE balance check
        wallet = request.user.wallet
        wallet.refresh_from_db()

        if wallet.balance < total_stake:
            return Response({'error': 'Insufficient balance'}, status=400)

        # Deduct
        wallet.balance = F('balance') - total_stake
        wallet.save()
        wallet.refresh_from_db()
        
        # Create transaction
        Transaction.objects.create(
            user=request.user,
            amount=total_stake,
            transaction_type='debit',
            description=f"Parlay bet placed (ID: {parlay_id})",
            reference=parlay_id
        )
        
        return Response({
            'message': 'Parlay bet placed successfully',
            'parlay_id': parlay_id,
            'total_odds': total_odds,
            'potential_win': potential_win,
            'bets': BetSerializer(bets, many=True).data
        }, status=status.HTTP_201_CREATED)


class UpcomingMatchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # 1. Define a unique cache key
        cache_key = "upcoming_matches_next_10"
        
        # 2. Attempt to fetch from Redis
        cached_data = cache.get(cache_key)
        if cached_data:
            # Adding a header or a key to indicate it's from cache is helpful for debugging
            cached_data["source"] = "cache"
            return Response(cached_data)

        try:
            url = "https://v3.football.api-sports.io/fixtures"
            params = {"next": 10}
            headers = {"x-apisports-key": settings.SPORTS_API_KEY}

            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status() # Ensure we don't cache 4xx or 5xx errors
            
            data = response.json()
            
            result = {
                "status": "success",
                "data": data,
                "source": "api"
            }

            # 3. Save to Redis for 5 minutes (300 seconds)
            # Only cache if the API actually returned a successful response
            if response.status_code == 200:
                cache.set(cache_key, result, timeout=300)

            return Response(result)

        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class ShareBetslipView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Accepts a selection list payload and returns a share code"""
        selections = request.data.get('selections')
        if not selections or not isinstance(selections, list):
            return Response({"error": "Invalid selections array"}, status=status.HTTP_400_BAD_REQUEST)
            
        shared_slip = SharedBetslip.objects.create(
            creator=request.user,
            selections_payload=selections
        )
        
        return Response({
            "share_code": shared_slip.code,
            "url": f"/betslip/{shared_slip.code}"
        }, status=status.HTTP_201_CREATED)


class RetrieveSharedBetslipView(APIView):
    permission_classes = [AllowAny] # Anyone can look up a code

    def get(self, request, code):
        """Looks up a share code and returns the selections payload to the frontend"""
        try:
            shared_slip = SharedBetslip.objects.get(code=code.upper())
            return Response({
                "code": shared_slip.code,
                "selections": shared_slip.selections_payload
            }, status=status.HTTP_200_OK)
        except SharedBetslip.DoesNotExist:
            return Response({"error": "Betslip code not found or expired"}, status=status.HTTP_404_NOT_FOUND)