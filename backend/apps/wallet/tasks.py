from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import transaction as db_transaction
from .models import Transaction, Wallet

@shared_task
def expire_stale_deposits():
    """
    Finds deposit requests older than 2 hours that are still 'pending'
    and marks them as failed/expired.
    """
    cutoff = timezone.now() - timedelta(hours=2)
    stale_tx = Transaction.objects.filter(
        status='pending',
        transaction_type='credit',
        created_at__lt=cutoff
    )
    
    updated = stale_tx.update(status='failed', description="Deposit expired (no payment received)")
    return f"Expired {updated} stale deposits"

@shared_task
def check_expired_bonuses():
    """
    Logic for bonus expiration if bonus_balance > 0
    """
    with db_transaction.atomic():
        # Example: Users with bonus balance who haven't bet in 30 days
        cutoff = timezone.now() - timedelta(days=30)
        wallets = Wallet.objects.filter(bonus_balance__gt=0, updated_at__lt=cutoff)
        
        count = wallets.count()
        wallets.update(bonus_balance=0)
        
    return f"Cleared bonus for {count} inactive wallets"