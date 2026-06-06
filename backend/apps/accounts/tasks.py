# account/tasks.py

from celery import shared_task
from django.core.cache import cache
from decimal import Decimal, InvalidOperation
import requests
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Currency

@shared_task
def update_exchange_rates():
    """
    Update global exchange rates from API.
    Base API Currency: KES (1 KES = X foreign currency units)
    Database requirement: exchange_rate_to_kES (1 foreign currency unit = X KES)
    """
    try:
        url = 'https://api.budjet.org/fiat/KES'
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            rates = data.get('rates', {})
            
            updated_count = 0
            channel_layer = get_channel_layer()
            
            # Dictionary to store formatted database representations for cache storage
            cached_db_rates = {}

            for currency_code, rate_value in rates.items():
                try:
                    # Parse the raw API value safely
                    rate = Decimal(str(rate_value))
                    if rate <= 0:
                        continue
                        
                    currency = Currency.objects.get(code=currency_code.upper())
                    
                    # Convert (1 KES = X foreign currency) to (1 foreign currency = X KES)
                    # Example: If 1 KES = 0.0076 USD, then 1 USD = (1 / 0.0076) = 131.57 KES
                    exchange_rate_to_kes = Decimal('1') / rate
                    
                    currency.exchange_rate_to_kES = exchange_rate_to_kes
                    currency.save()
                    
                    updated_count += 1
                    cached_db_rates[currency.code] = float(exchange_rate_to_kes)

                    # ⚡ Real-Time Broadcast: Stream the updated rate to connected clients
                    if channel_layer:
                        async_to_sync(channel_layer.group_send)(
                            'currency_updates',
                            {
                                'type': 'currency_update',
                                'currency': currency.code,
                                'rate': float(exchange_rate_to_kes),
                                'symbol': currency.symbol
                            }
                        )
                except Currency.DoesNotExist:
                    continue
                except (InvalidOperation, ZeroDivisionError):
                    continue
            
            # Cache the actual converted rates (relative to 1 Unit = X KES) for instant backend access
            cache.set('exchange_rates', cached_db_rates, timeout=3600)
            cache.set('exchange_rates_timestamp', timezone.now().isoformat(), timeout=3600)
            
            return f"Successfully updated and broadcasted {updated_count} global exchange rates."
        else:
            return f"Failed to fetch exchange rates. HTTP Status: {response.status_code}"
            
    except Exception as e:
        return f"Error encountered while running exchange rate daemon: {str(e)}"


@shared_task
def convert_amount_task(amount, from_currency_code, to_currency_code):
    """
    Celery task wrapper to perform currency conversions across async workers.
    """
    try:
        from_curr = Currency.objects.get(code=from_currency_code.upper())
        to_curr = Currency.objects.get(code=to_currency_code.upper())
        
        amount_decimal = Decimal(str(amount))
        
        # Convert foreign asset value into KES value pool, then divide into target currency space
        amount_in_kes = amount_decimal * from_curr.exchange_rate_to_kES
        converted_amount = amount_in_kes / to_curr.exchange_rate_to_kES
        
        return float(round(converted_amount, 4))
    except Currency.DoesNotExist:
        return None