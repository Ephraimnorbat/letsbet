from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
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
        
        # Check if user has sufficient balance
        if user.wallet.balance < serializer.validated_data['stake']:
            raise serializers.ValidationError("Insufficient balance")
        
        # Create the bet
        bet = serializer.save(user=user)
        
        # Deduct from wallet
        user.wallet.balance -= bet.stake
        user.wallet.save()
        
        # Create transaction record
        Transaction.objects.create(
            user=user,
            amount=bet.stake,
            transaction_type='debit',
            description=f"Bet placed on {bet.match}",
            reference=f"BET_{bet.id}"
        )
        
        # Update user stats
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
            request.user.wallet.balance += cashout_amount
            request.user.wallet.save()
            
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
        request.user.wallet.balance -= total_stake
        request.user.wallet.save()
        
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