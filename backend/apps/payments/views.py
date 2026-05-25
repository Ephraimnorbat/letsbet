import uuid
import hashlib
import hmac
import json

from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction
import requests

from apps.wallet.models import Wallet, Transaction
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
            # THIS IS THE MOST IMPORTANT PART: It will show you exactly what NOWPayments hates
            print(f"NOWPayments API Error: {e.response.text}")
            return Response({"error": e.response.json()}, status=e.response.status_code)
        except Exception as e:
            print(f"System Error: {str(e)}")
            return Response({"error": "Internal Server Error"}, status=500)

class RequestWithdrawalView(APIView):
    """Entry point for Manual Withdrawals"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        amount_raw = request.data.get("amount")
        method = request.data.get("method") # e.g. M-Pesa, Bank, USDT
        details = request.data.get("details")

        # 1. Validate and convert the amount safely to a Decimal
        try:
            amount = Decimal(str(amount_raw))
        except (ValueError, TypeError, InvalidOperation):
            return Response({"error": "Invalid amount format"}, status=400)

        if amount <= 0:
            return Response({"error": "Amount must be greater than zero"}, status=400)

        # Use atomic transaction to ensure balance and records match
        with db_transaction.atomic():
            # select_for_update() locks the row to prevent race conditions
            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=user)
            
            if wallet.balance < amount:
                return Response({"error": "Insufficient balance"}, status=400)

            # 2. Deduct immediately (using pure Decimal math)
            wallet.balance -= amount
            wallet.total_withdrawn += amount
            wallet.save()

            # 3. Create Admin Request
            withdrawal = WithdrawalRequest.objects.create(
                user=user,
                amount=amount,
                withdrawal_method=method,
                address_details=details,
                status='pending'
            )

            # 4. Create Ledger Entry in Wallet App
            Transaction.objects.create(
                user=user,
                amount=amount,
                transaction_type='debit',
                status='pending',
                description=f'Withdrawal request to {method}',
                reference=f"WTH-{withdrawal.id}",
                payment_method=method,
                payment_details={'details': details}
            )

        return Response({"message": "Withdrawal request submitted for approval."})


class NowPaymentsWebhookView(APIView):
    permission_classes = []  # Publicly accessible

    def post(self, request):
        # 1. Signature Verification
        received_sig = request.headers.get("x-nowpayments-sig")
        payload = request.body
        
        # If testing manually with Postman/cURL, signature will fail. 
        # For production, we keep it strict.
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
        data = request.data # DRF automatically parses JSON body
        payment_id = data.get("payment_id")
        status = data.get("payment_status")
        
        print(f"WEBHOOK RECEIVED: Payment {payment_id} is now {status}")

        try:
            tx = PaymentTransaction.objects.get(payment_id=payment_id)
        except PaymentTransaction.DoesNotExist:
            print(f"WEBHOOK ERROR: Payment ID {payment_id} not found in database")
            return Response({"error": "Transaction not found"}, status=404)

        # Update status immediately
        tx.status = status
        tx.save()

        # 3. Credit Wallet
        if status == "finished" and not tx.is_credited:
            with transaction.atomic():
                wallet, _ = Wallet.objects.select_for_update().get_or_create(user=tx.user)

                # Convert to Decimal to match the Wallet model's field type
                amount_to_add = Decimal(str(tx.price_amount)) 
                
                wallet.balance += amount_to_add
                wallet.total_deposited += amount_to_add
                wallet.save()

                # Record in Ledger using the same Decimal value
                Transaction.objects.create(
                    user=tx.user,
                    amount=amount_to_add,
                    transaction_type='credit',
                    status='completed',
                    description=f'Deposit via {tx.pay_currency.upper()}',
                    reference=tx.order_id,
                    payment_method='crypto',
                    payment_details=data,
                    completed_at=timezone.now()
                )

                tx.is_credited = True
                tx.save()

            # 4. WebSocket Update
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

        return Response({"status": "ok"})

