def resolve_user_currency(country=None, preferred_currency=None):
    from .models import Currency  # lazy import to avoid circular import

    # 1. If user explicitly chose currency → use it
    if preferred_currency:
        return preferred_currency

    # 2. If country has default currency → use it
    if country and country.default_currency:
        return country.default_currency

    # 3. Fallback → USD (your new system default)
    currency, _ = Currency.objects.get_or_create(
        code='USD',
        defaults={
            'name': 'US Dollar',
            'symbol': '$',
            'exchange_rate_to_kES': 130.0  # adjust if needed
        }
    )
    return currency
  

def convert_amount(amount, from_currency, to_currency):
    """
    Convert amount between currencies using KES as base
    """
    if from_currency.code == to_currency.code:
        return amount

    # Convert to KES first
    amount_in_kes = amount * from_currency.exchange_rate_to_kES

    # Convert to target currency
    converted = amount_in_kes / to_currency.exchange_rate_to_kES

    return round(converted, 2)