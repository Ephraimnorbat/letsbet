# account/helpers.py

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from .models import Currency

def resolve_user_currency(country=None, preferred_currency=None):
    """
    Centralized currency fallback engine resolution hierarchy:
    1. Explicit User Preference Configuration Choice.
    2. Regional Country Default Currency Parameter.
    3. Global Default Platform Asset configuration profile (USD fallback tracker).
    """
    if preferred_currency:
        return preferred_currency

    if country and country.default_currency:
        return country.default_currency

    # Final System Root Fallback Anchor -> Hardcoded global USD currency record
    currency, _ = Currency.objects.get_or_create(
        code='USD',
        defaults={
            'name': 'US Dollar',
            'symbol': '$',
            'exchange_rate_to_kES': Decimal('130.0000'),
            'is_active': True
        }
    )
    return currency
  

def convert_amount(amount, from_currency, to_currency):
    """
    Converts any target numeric volume across asset limits precisely using KES as the base engine.
    """
    if not from_currency or not to_currency:
        return amount

    if from_currency.code == to_currency.code:
        return float(amount)

    try:
        # Cast input safely to string first to eliminate float serialization artifacts
        amount_decimal = Decimal(str(amount))
        
        from_rate = Decimal(str(from_currency.exchange_rate_to_kES))
        to_rate = Decimal(str(to_currency.exchange_rate_to_kES))
        
        if from_rate <= 0 or to_rate <= 0:
            return float(amount)

        # Step 1: Normalize input token back to standard base KES pool
        amount_in_kes = amount_decimal * from_rate

        # Step 2: Extract value space representation in terms of target destination parameters
        converted = amount_in_kes / to_rate

        # Round to 2 decimal places to match traditional global banking profiles
        return float(converted.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        
    except (InvalidOperation, ValueError, ZeroDivisionError):
        return float(amount)