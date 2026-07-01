from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
import uuid

from rest_framework.permissions import IsAdminUser
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from decimal import Decimal

from .models import Voucher, VoucherType, VoucherAuditLog, Transaction, Wallet
from .serializers import (
    VoucherSerializer, VoucherCreateSerializer, 
    VoucherRedeemSerializer, VoucherTypeSerializer,
    VoucherAuditLogSerializer, WalletSerializer, TransactionSerializer
)


class WalletBalanceView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet


class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')
    


class AdminWalletAuditView(generics.ListAPIView):
    """
    Returns every wallet in the system.

    Used by the Super Admin dashboard.
    """
    permission_classes = [IsAdminUser]
    serializer_class = WalletSerializer

    queryset = Wallet.objects.select_related("user").all().order_by("-updated_at")



class VoucherTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """View for voucher types"""
    queryset = VoucherType.objects.filter(is_active=True)
    serializer_class = VoucherTypeSerializer
    permission_classes = [IsAuthenticated]

class VoucherViewSet(viewsets.ModelViewSet):
    """View for voucher management"""
    queryset = Voucher.objects.all()
    serializer_class = VoucherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Voucher.objects.all()
        return Voucher.objects.filter(redeemed_by=user) | Voucher.objects.filter(generated_by=user)
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_voucher(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators can create vouchers'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = VoucherCreateSerializer(data=request.data)
        if not serializer.is_valid():
            # Return detailed validation errors
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            voucher_type = VoucherType.objects.get(id=serializer.validated_data['voucher_type_id'])
        except VoucherType.DoesNotExist:
            return Response(
                {'error': 'Invalid voucher type ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        amount = serializer.validated_data['amount']
        user = request.user

        # Determine currency: user's preferred > country default > system default
        from apps.accounts.models import Currency
        currency_code = None

        if hasattr(user, 'preferred_currency') and user.preferred_currency:
            currency_code = user.preferred_currency.code
        elif hasattr(user, 'country') and user.country and user.country.default_currency:
            currency_code = user.country.default_currency.code
        else:
            # System default: first active currency
            default_currency = Currency.objects.filter(is_active=True).first()
            if default_currency:
                currency_code = default_currency.code

        # Allow request to override
        currency_code = serializer.validated_data.get('currency', currency_code)

        if not currency_code:
            return Response(
                {'error': 'No currency could be determined. Please set a currency for the user or system.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create voucher
        voucher = Voucher.objects.create(
            voucher_type=voucher_type,
            amount=amount,
            currency=currency_code,
            vendor_name=serializer.validated_data.get('vendor_name', ''),
            vendor_contact=serializer.validated_data.get('vendor_contact', ''),
            generated_by=request.user,
            status='active',
            expires_at=timezone.now() + timezone.timedelta(
                days=serializer.validated_data.get('expires_in_days', 7)
            )
        )

        # Log creation
        VoucherAuditLog.objects.create(
            voucher=voucher,
            user=request.user,
            action='generated',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={
                'amount': str(amount),
                'type': voucher_type.name,
                'currency': currency_code
            }
        )

        return Response({
            'message': 'Voucher created successfully',
            'voucher': VoucherSerializer(voucher).data,
            'voucher_code': voucher.code,
            'currency': currency_code
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='redeem')
    @transaction.atomic
    def redeem(self, request):
        serializer = VoucherRedeemSerializer(data=request.data)
        if serializer.is_valid():
            # This is now the clean code (no spaces)
            clean_code = serializer.validated_data['code']
            
            # Try to find the voucher (it might be stored with or without spaces)
            try:
                voucher = Voucher.objects.get(code=clean_code)
            except Voucher.DoesNotExist:
                # If not found, try with spaces (formatted version)
                formatted = ' '.join(clean_code[i:i+4] for i in range(0, 16, 4))
                try:
                    voucher = Voucher.objects.get(code=formatted)
                except Voucher.DoesNotExist:
                    return Response(
                        {'error': 'Invalid voucher code'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Check if voucher is valid
            if voucher.status != 'active':
                return Response(
                    {'error': f'Voucher is already {voucher.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if voucher.expires_at and voucher.expires_at < timezone.now():
                voucher.status = 'expired'
                voucher.save()
                return Response(
                    {'error': 'Voucher has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user already redeemed this voucher
            if voucher.redeemed_by:
                return Response(
                    {'error': 'Voucher has already been redeemed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Redeem the voucher
            user = request.user
            
            # Get or create wallet
            wallet, created = Wallet.objects.get_or_create(user=user)
            
            # Convert amount to user's currency if needed
            amount_to_add = voucher.amount
            if voucher.currency != wallet.currency.code:
                # Convert using exchange rate
                try:
                    from apps.accounts.models import Currency
                    voucher_currency = Currency.objects.get(code=voucher.currency)
                    wallet_currency = Currency.objects.get(code=wallet.currency.code)
                    
                    # Convert to KES first, then to wallet currency
                    amount_in_kes = voucher.amount * voucher_currency.exchange_rate_to_kES
                    amount_to_add = amount_in_kes / wallet_currency.exchange_rate_to_kES
                except Exception as e:
                    # If conversion fails, use the original amount
                    amount_to_add = voucher.amount
                    print(f"Currency conversion failed: {e}")
            
            # Add amount to wallet
            wallet.balance += amount_to_add
            wallet.save()
            
            # Create transaction record
            transaction_ref = f"VCH_{uuid.uuid4().hex[:12].upper()}"
            transaction = Transaction.objects.create(
                user=user,
                amount=amount_to_add,
                transaction_currency_code=wallet.currency.code,
                transaction_type='credit',
                status='completed',
                description=f"Voucher deposit: {voucher.code} (Original: {voucher.currency} {voucher.amount})",
                reference=transaction_ref,
                payment_method='voucher',
                payment_details={
                    'voucher_code': voucher.code,
                    'original_currency': voucher.currency,
                    'original_amount': float(voucher.amount),
                    'converted_amount': float(amount_to_add)
                }
            )
            
            # Update voucher
            voucher.status = 'used'
            voucher.redeemed_by = user
            voucher.redeemed_at = timezone.now()
            voucher.transaction = transaction
            voucher.save()
            
            # Log redemption
            VoucherAuditLog.objects.create(
                voucher=voucher,
                user=user,
                action='redeemed',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'amount': str(voucher.amount),
                    'currency': voucher.currency,
                    'converted_amount': str(amount_to_add),
                    'wallet_currency': wallet.currency.code
                }
            )
            
            return Response({
                'message': 'Voucher redeemed successfully',
                'amount': float(amount_to_add),
                'currency': wallet.currency.code,
                'original_currency': voucher.currency,
                'original_amount': float(voucher.amount),
                'new_balance': float(wallet.balance),
                'transaction_reference': transaction_ref
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a voucher (admin only)"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators can cancel vouchers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        voucher = self.get_object()
        
        if voucher.status != 'active':
            return Response(
                {'error': f'Cannot cancel voucher with status: {voucher.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        voucher.status = 'cancelled'
        voucher.save()
        
        VoucherAuditLog.objects.create(
            voucher=voucher,
            user=request.user,
            action='cancelled',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'reason': request.data.get('reason', 'No reason provided')}
        )
        
        return Response({'message': 'Voucher cancelled successfully'})

    @action(detail=False, methods=['get'])
    def audit_logs(self, request):
        """Get voucher audit logs"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators can view audit logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        voucher_id = request.query_params.get('voucher_id')
        if voucher_id:
            logs = VoucherAuditLog.objects.filter(voucher_id=voucher_id)
        else:
            logs = VoucherAuditLog.objects.all()
        
        serializer = VoucherAuditLogSerializer(logs, many=True)
        return Response(serializer.data)