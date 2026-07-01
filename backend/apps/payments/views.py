import uuid
import hashlib
import hmac
import json

from rest_framework import status
from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import requests
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from apps.accounts.models import Currency
# App Imports
from apps.wallet.models import Wallet, Transaction, Currency  # Added Currency mapping relation here
from .models import PaymentTransaction, WithdrawalRequest
from .services.nowpayments import NowPaymentsService
from django.contrib.auth import get_user_model

User = get_user_model()

class CreateDepositView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            amount = request.data.get("amount")
            pay_currency = request.data.get("pay_currency", "usdttrc20")

            if not amount:
                return Response({"error": "Amount is required"}, status=400)

            order_id = f"DEP_{uuid.uuid4().hex[:10].upper()}"

            payment_data = NowPaymentsService.create_payment(
                amount=amount,
                order_id=order_id,
                pay_currency=pay_currency
            )

            # Record locally
            PaymentTransaction.objects.create(
                user=user,
                order_id=order_id,
                payment_id=payment_data.get("payment_id"),
                pay_address=payment_data.get("pay_address"),
                price_amount=amount,
                pay_amount=payment_data.get("pay_amount"),
                pay_currency=payment_data.get("pay_currency"),
            )

            return Response(payment_data)

        except requests.exceptions.HTTPError as e:
            print(f"NOWPayments API Error: {e.response.text}")
            return Response({"error": e.response.json()}, status=e.response.status_code)
        except Exception as e:
            print(f"System Error: {str(e)}")
            return Response({"error": "Internal Server Error"}, status=500)


class RequestWithdrawalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        amount_raw = request.data.get("amount")
        method = request.data.get("method")
        details = request.data.get("details")

        # ----------------------------
        # Validate amount
        # ----------------------------
        try:
            amount = Decimal(str(amount_raw))
        except (ValueError, TypeError, InvalidOperation):
            return Response(
                {"error": "Invalid amount format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than zero"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not method:
            return Response(
                {"error": "Withdrawal method is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not details:
            return Response(
                {"error": "Withdrawal details are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------
        # User currency
        # ----------------------------
        user_currency = user.preferred_currency

        if not user_currency:
            return Response(
                {"error": "User has no preferred currency configured."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------
        # Minimum withdrawal
        # ----------------------------
        if amount < Decimal("10"):
            return Response(
                {
                    "error": f"Minimum withdrawal is {user_currency.symbol}10.00"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            with db_transaction.atomic():

                wallet, _ = Wallet.objects.select_for_update().get_or_create(
                    user=user
                )

                if wallet.balance < amount:
                    return Response(
                        {"error": "Insufficient balance"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # -------------------------------------------------
                # Prevent duplicate pending withdrawals
                # -------------------------------------------------
                existing = WithdrawalRequest.objects.filter(
                    user=user,
                    status="pending"
                ).first()

                if existing:
                    return Response(
                        {
                            "error": "You already have a pending withdrawal awaiting approval."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # -------------------------------------------------
                # Deduct wallet
                # -------------------------------------------------
                wallet.balance -= amount
                wallet.total_withdrawn += amount
                wallet.save()

                # -------------------------------------------------
                # Create withdrawal request
                # -------------------------------------------------
                withdrawal = WithdrawalRequest.objects.create(
                    user=user,
                    amount=amount,
                    currency=user_currency,
                    withdrawal_method=method,
                    address_details=details,
                    status="pending",
                )

                reference = f"WTH-{withdrawal.id}"

                # -------------------------------------------------
                # Create transaction only once
                # -------------------------------------------------
                transaction, created = Transaction.objects.get_or_create(
                    reference=reference,
                    defaults={
                        "user": user,
                        "amount": amount,
                        "transaction_currency_code": user_currency.code,
                        "transaction_type": "debit",
                        "status": "pending",
                        "category": "withdrawal",
                        "description": f"Withdrawal request to {method}",
                        "payment_method": method,
                        "payment_details": {
                            "details": details,
                            "currency_code": user_currency.code,
                            "currency_symbol": user_currency.symbol,
                        },
                    },
                )

                # This should never happen unless something is seriously wrong
                if not created:
                    raise Exception(
                        f"Transaction reference {reference} already exists."
                    )

            return Response(
                {
                    "message": "Withdrawal request submitted successfully.",
                    "withdrawal_id": withdrawal.id,
                    "transaction_reference": reference,
                    "amount": float(amount),
                    "currency": user_currency.code,
                    "symbol": user_currency.symbol,
                    "status": withdrawal.status,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()

            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
class NowPaymentsWebhookView(APIView):
    permission_classes = []  # Publicly accessible

    def post(self, request):
        # 1. Signature Verification
        received_sig = request.headers.get("x-nowpayments-sig")
        payload = request.body
        
        if not settings.DEBUG: 
            expected_sig = hmac.new(
                key=settings.NOWPAYMENTS_IPN_SECRET.encode(),
                msg=payload,
                digestmod=hashlib.sha512
            ).hexdigest()

            if received_sig != expected_sig:
                print("WEBHOOK ERROR: Invalid Signature")
                return Response({"error": "Invalid signature"}, status=400)

        # 2. Extract Data
        data = request.data 
        payment_id = data.get("payment_id")
        status = data.get("payment_status")
        
        print(f"WEBHOOK RECEIVED: Payment {payment_id} is now {status}")

        try:
            tx = PaymentTransaction.objects.get(payment_id=payment_id)
        except PaymentTransaction.DoesNotExist:
            print(f"WEBHOOK ERROR: Payment ID {payment_id} not found in database")
            return Response({"error": "Transaction not found"}, status=404)

        # Update transactional state status index
        tx.status = status
        tx.save()

        # 3. Credit Wallet using Dynamic Currency Conversions
        if status == "finished" and not tx.is_credited:
            try:
                # Resolve the user's active display currency context from the wallet profile
                with db_transaction.atomic():
                    wallet, _ = Wallet.objects.select_for_update().get_or_create(user=tx.user)
                    user_currency = wallet.currency

                    # Convert incoming price_amount to clean Decimal string values
                    inbound_raw_amount = Decimal(str(tx.price_amount))

                    # Multi-Currency Conversion Logic
                    # KES Base Amount = Incoming Foreign Amount / exchange_rate_to_kes
                    if user_currency.code == 'KES':
                        base_kes_amount = inbound_raw_amount
                    else:
                        base_kes_amount = inbound_raw_amount / user_currency.exchange_rate_to_kes
                    
                    base_kes_amount = base_kes_amount.quantize(Decimal('0.01'))

                    # Apply base value mutations to the user's wallet
                    wallet.balance += base_kes_amount
                    wallet.total_deposited += base_kes_amount
                    wallet.save()

                    # Record transaction log line item using the resolved system currency data
                    Transaction.objects.create(
                        user=tx.user,
                        amount=base_kes_amount,
                        transaction_currency_code=user_currency.code,
                        transaction_type='credit',
                        status='completed',
                        category='deposit',
                        description=f'Deposit via {tx.pay_currency.upper()}',
                        reference=tx.order_id,
                        payment_method='crypto',
                        payment_details=data,
                        completed_at=timezone.now()
                    )

                    tx.is_credited = True
                    tx.save()

                # 4. WebSocket Notification Update
                try:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"user_{tx.user.id}",
                        {
                            "type": "payment_update",
                            "status": "completed",
                            "amount": str(tx.price_amount),
                            "balance": str(wallet.balance),
                        }
                    )
                except Exception as e:
                    print(f"WebSocket Error: {str(e)}")

            except Exception as processing_err:
                print(f"Critical Webhook wallet processing structural fault: {str(processing_err)}")
                return Response({"error": "Failed to process ledger balance credit"}, status=500)

        return Response({"status": "ok"})
    


class AdminDepositsListView(APIView):
    """
    Administrative Ledger: Returns all global crypto payment transactions
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        transactions = PaymentTransaction.objects.select_related('user').all().order_by('-created_at')
        
        data = []
        for tx in transactions:
            data.append({
                "id": str(tx.id),
                "order_id": tx.order_id,
                "payment_id": tx.payment_id,
                "username": tx.user.username,
                "email": tx.user.email,
                # 🔥 Fixed here: Changed 'wth' to 'tx'
                "user": {
                    "id": tx.user.id,
                    "username": tx.user.username,
                    "email": tx.user.email,
                },
                "price_amount": float(tx.price_amount),
                "price_currency": tx.price_currency,
                "pay_amount": float(tx.pay_amount) if tx.pay_amount else None,
                "pay_currency": tx.pay_currency,
                "status": tx.status,
                "is_credited": tx.is_credited,
                "created_at": tx.created_at.isoformat(),
            })
            
        return Response(data)

class AdminWithdrawalsListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # No filtering whatsoever – just return all withdrawals.
        qs = WithdrawalRequest.objects.select_related('user', 'currency').all().order_by('-created_at')
        data = []
        for wth in qs:
            currency_symbol = wth.currency.symbol if wth.currency else 'KSh'
            currency_code = wth.currency.code if wth.currency else 'KES'
            data.append({
                "id": wth.id,
                "amount": float(wth.amount),
                "currency": currency_code,
                "currency_symbol": currency_symbol,
                "withdrawal_method": wth.withdrawal_method,
                "address_details": wth.address_details,
                "status": wth.status,
                "admin_notes": wth.admin_notes,
                "created_at": wth.created_at.isoformat(),
                "username": wth.user.username,
                "email": wth.user.email,
                "user": {
                    "id": wth.user.id,
                    "username": wth.user.username,
                    "email": wth.user.email,
                },
                "user_details": {
                    "id": wth.user.id,
                    "username": wth.user.username,
                    "email": wth.user.email,
                }
            })
        return Response(data)
class ProcessWithdrawalView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        action = request.data.get("action")
        admin_notes = request.data.get("admin_notes", "")

        if action not in ['approve', 'reject']:
            return Response(
                {"error": "Valid action ('approve' or 'reject') required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with db_transaction.atomic():
                # ✅ Get the withdrawal without any filtering on currency
                withdrawal = WithdrawalRequest.objects.select_for_update().get(pk=pk)

                if withdrawal.status != 'pending':
                    return Response(
                        {"error": "This transaction has already been processed"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if action == 'approve':
                    withdrawal.status = 'approved'
                    withdrawal.admin_notes = admin_notes
                    withdrawal.save()

                    # ✅ Update Transaction by reference only
                    Transaction.objects.filter(reference=f"WTH-{withdrawal.id}").update(status='completed')

                elif action == 'reject':
                    withdrawal.status = 'rejected'
                    withdrawal.admin_notes = admin_notes
                    withdrawal.save()

                    wallet, _ = Wallet.objects.select_for_update().get_or_create(user=withdrawal.user)
                    wallet.balance += withdrawal.amount
                    wallet.total_withdrawn -= withdrawal.amount
                    wallet.save()

                    Transaction.objects.filter(reference=f"WTH-{withdrawal.id}").update(
                        status='failed',
                        description=f"Rejected: {admin_notes}"
                    )

            return Response(
                {"message": f"Withdrawal request successfully marked as {withdrawal.status}."},
                status=status.HTTP_200_OK
            )

        except WithdrawalRequest.DoesNotExist:
            return Response(
                {"error": "Withdrawal request not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error processing withdrawal: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )