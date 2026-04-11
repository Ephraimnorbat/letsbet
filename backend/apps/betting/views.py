from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils import timezone
from django.db.models import F
from rest_framework.views import APIView
import requests
from django.conf import settings
from django.core.cache import cache


from .models import Bet, BetSlip, BetType
from .serializers import BetSerializer, CreateBetSerializer, BetSlipSerializer, BetTypeSerializer
from apps.wallet.models import Transaction


class BetTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BetType.objects.filter(is_active=True)
    serializer_class = BetTypeSerializer
    permission_classes = [IsAuthenticated]

class PlaceBetView(generics.CreateAPIView):
    serializer_class = CreateBetSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        wallet = user.wallet

        # 🔥 SAFE balance check
        wallet.refresh_from_db()
        if wallet.balance < serializer.validated_data['stake']:
            raise serializers.ValidationError("Insufficient balance")

        # Create bet
        bet = serializer.save(user=user)

        # 🔥 SAFE deduction
        wallet.balance = F('balance') - bet.stake
        wallet.save()
        wallet.refresh_from_db()

        # Transaction
        Transaction.objects.create(
            user=user,
            amount=bet.stake,
            transaction_type='debit',
            description=f"Bet placed on {bet.match}",
            reference=f"BET_{bet.id}"
        )

        user.total_bets += 1
        user.save()

        return bet

class MyBetsView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user).order_by('-created_at')

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