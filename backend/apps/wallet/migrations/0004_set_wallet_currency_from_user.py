from django.db import migrations
from django.core.exceptions import ObjectDoesNotExist

def set_wallet_currencies(apps, schema_editor):
    Wallet = apps.get_model('wallet', 'Wallet')
    Currency = apps.get_model('accounts', 'Currency')
    
    for wallet in Wallet.objects.select_related('user').all():
        if wallet.user:
            # Try to get user's preferred currency
            if hasattr(wallet.user, 'preferred_currency') and wallet.user.preferred_currency:
                wallet.currency = wallet.user.preferred_currency
            else:
                # Fallback to KES or any currency
                try:
                    wallet.currency = Currency.objects.get(code='KES')
                except Currency.DoesNotExist:
                    wallet.currency = Currency.objects.first()
            wallet.save()

def reverse_set_wallet_currencies(apps, schema_editor):
    # Optionally reverse, but we can just set to None
    Wallet = apps.get_model('wallet', 'Wallet')
    Wallet.objects.update(currency=None)

class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0003_vouchertype_voucher_voucherauditlog_and_more'),  # Replace with actual previous migration
    ]

    operations = [
        migrations.RunPython(set_wallet_currencies, reverse_set_wallet_currencies),
    ]