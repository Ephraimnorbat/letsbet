from celery import shared_task
from django.core.cache import cache
from decimal import Decimal
import requests
from .models import Currency

@shared_task
def update_exchange_rates():
    """
    Update exchange rates from free API
    Base currency: KES (Kenyan Shilling)
    """
    try:
        # Using free budget.org API
        url = 'https://api.budjet.org/fiat/KES'
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            rates = data.get('rates', {})
            
            # Update each currency's exchange rate
            updated_count = 0
            for currency_code, rate in rates.items():
                try:
                    currency = Currency.objects.get(code=currency_code)
                    # Convert rate (1 KES = X currency) to (1 currency = X KES)
                    exchange_rate = Decimal(1 / rate) if rate > 0 else Decimal(1)
                    currency.exchange_rate_to_kES = exchange_rate
                    currency.save()
                    updated_count += 1
                except Currency.DoesNotExist:
                    continue
            
            # Cache the rates for quick access
            cache.set('exchange_rates', rates, timeout=3600)  # Cache for 1 hour
            
            return f"Updated {updated_count} exchange rates"
        else:
            return f"Failed to fetch exchange rates: {response.status_code}"
            
    except Exception as e:
        return f"Error updating exchange rates: {str(e)}"

@shared_task
def convert_amount(amount, from_currency_code, to_currency_code):
    """
    Convert amount between currencies
    """
    try:
        from_currency = Currency.objects.get(code=from_currency_code)
        to_currency = Currency.objects.get(code=to_currency_code)
        
        # Convert to KES first, then to target currency
        amount_in_kES = amount * from_currency.exchange_rate_to_kES
        converted_amount = amount_in_kES / to_currency.exchange_rate_to_kES
        
        return float(converted_amount)
    except Currency.DoesNotExist:
        return None