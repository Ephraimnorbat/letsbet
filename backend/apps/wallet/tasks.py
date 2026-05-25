from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import requests
from django.core.cache import cache
from django.db import transaction as db_transaction


from .models import Transaction, Wallet, CurrencyRate



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


@shared_task
def sync_exchange_rates():
    """Fetches fiat data from Frankfurter API and saves to cache/DB"""
    try:
        # Fetch conversions with EUR base
        url = "https://api.frankfurter.app/latest?from=EUR&to=KES,USD,GBP"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        rates = data.get('rates', {})
        # Save EUR baseline explicitly
        CurrencyRate.objects.update_or_create(target='EUR', defaults={'rate': 1.0000})
        
        for currency, rate in rates.items():
            CurrencyRate.objects.update_or_create(
                target=currency,
                defaults={'rate': rate}
            )
            
        # Invalidate cache
        cache.delete('global_currency_rates')
        return "Currency exchange parameters synced successfully."
    except Exception as e:
        return f"Failed to sync currency metrics: {str(e)}"