from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction as db_transaction
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import WithdrawalRequest
from apps.wallet.models import Wallet, Transaction

@receiver(post_save, sender=WithdrawalRequest)
def handle_withdrawal_status_change(sender, instance, created, **kwargs):
    # We only care about updates to existing requests (Admin actions)
    if created:
        return 

    # Unique reference used when the request was created
    tx_reference = f"WTH-{instance.id}"
    
    # 1. Atomic transaction block to prevent race conditions
    with db_transaction.atomic():
        try:
            # Use select_for_update to lock the transaction row
            wallet_tx = Transaction.objects.select_for_update().get(reference=tx_reference)
            
            # GUARD: If transaction is already finalized, stop here to avoid duplicates
            if wallet_tx.status in ['completed', 'failed']:
                return

            wallet = Wallet.objects.select_for_update().get(user=instance.user)

            if instance.status == 'approved':
                # Balance was already deducted in WithdrawView.
                # Just finalize the transaction records.
                wallet_tx.status = 'completed'
                wallet_tx.completed_at = timezone.now()
                wallet_tx.save()

            elif instance.status == 'rejected':
                # REFUND: The user's money was held; give it back.
                wallet.balance += instance.amount
                wallet.total_withdrawn -= instance.amount # Correct the stat
                wallet.save()

                wallet_tx.status = 'failed'
                wallet_tx.description = f"Rejected: {instance.admin_notes or 'Admin denied request'}"
                wallet_tx.save()

            # 2. Trigger WebSocket to update UI in real-time
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.user.id}",
                {
                    "type": "payment_update",
                    "status": instance.status, 
                    "amount": str(instance.amount),
                    "balance": str(wallet.balance),
                }
            )

        except (Transaction.DoesNotExist, Wallet.DoesNotExist):
            # Log error: Withdrawal exists but no wallet/transaction record found
            pass