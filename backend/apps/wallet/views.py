from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
import uuid
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer, DepositSerializer, WithdrawSerializer

class WalletBalanceView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet

class DepositView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DepositSerializer

    @transaction.atomic
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            payment_method = serializer.validated_data['payment_method']
            
            # Create transaction record
            reference = f"DEP_{uuid.uuid4().hex[:12].upper()}"
            transaction_obj = Transaction.objects.create(
                user=request.user,
                amount=amount,
                transaction_type='credit',
                description=f"Deposit via {payment_method}",
                reference=reference,
                payment_method=payment_method
            )
            
            # Update wallet
            wallet, created = Wallet.objects.get_or_create(user=request.user)
            wallet.balance += amount
            wallet.total_deposited += amount
            wallet.save()
            
            # Update transaction status
            transaction_obj.status = 'completed'
            transaction_obj.completed_at = timezone.now()
            transaction_obj.save()
            
            return Response({
                'message': 'Deposit successful',
                'transaction_id': reference,
                'new_balance': wallet.balance
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WithdrawView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WithdrawSerializer

    @transaction.atomic
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            bank_account = serializer.validated_data['bank_account']
            
            wallet, created = Wallet.objects.get_or_create(user=request.user)
            
            if wallet.balance < amount:
                return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create transaction record
            reference = f"WTH_{uuid.uuid4().hex[:12].upper()}"
            transaction_obj = Transaction.objects.create(
                user=request.user,
                amount=amount,
                transaction_type='debit',
                description=f"Withdrawal to {bank_account}",
                reference=reference,
                payment_details={'bank_account': bank_account}
            )
            
            # Update wallet
            wallet.balance -= amount
            wallet.total_withdrawn += amount
            wallet.save()
            
            # Update transaction status
            transaction_obj.status = 'completed'
            transaction_obj.completed_at = timezone.now()
            transaction_obj.save()
            
            return Response({
                'message': 'Withdrawal request successful',
                'transaction_id': reference,
                'new_balance': wallet.balance
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')