from decimal import Decimal
from django.db import transaction
from django.utils import timezone
import uuid
from .models import Wallet, Transaction, Currency

def process_deposit_payment(user, input_amount, inbound_currency_code, payment_method="Crypto", payment_details=None):
    """
    Core business service to process an inbound payment.
    Converts foreign currencies back into base KES using database configurations.
    Uses an atomic transaction to guarantee financial data integrity.
    """
    if payment_details is None:
        payment_details = {}

    # Wrap in an atomic block so if any database operation fails, everything rolls back safely
    with transaction.atomic():
        # 1. Fetch the active exchange rate rules dynamically
        try:
            currency_config = Currency.objects.get(code=inbound_currency_code.upper(), is_active=True)
        except Currency.DoesNotExist:
            raise ValueError(f"The currency code '{inbound_currency_code}' is currently unsupported or inactive.")

        # 2. Multi-Currency Math Calculation
        # Base KES Amount = Inbound Target Amount / exchange_rate_to_kes
        amount_in_usd_equiv = Decimal(str(input_amount))
        base_kes_amount = amount_in_usd_equiv / currency_config.exchange_rate_to_kes
        base_kes_amount = base_kes_amount.quantize(Decimal('0.01'))

        # 3. Mutate the User's Wallet balance parameters
        # Select for update locks the row in the database until the block finishes to prevent race conditions
        wallet, created = Wallet.objects.select_for_update().get_or_create(user=user)
        wallet.balance += base_kes_amount
        wallet.total_deposited += base_kes_amount
        wallet.save()

        # 4. Generate a unique system tracking reference string
        unique_reference = f"DEP-{uuid.uuid4().hex[:12].upper()}"

        # 5. Log the complete audit trail history record
        transaction_log = Transaction.objects.create(
            user=user,
            amount=base_kes_amount, # Consistently tracked in our KES accounting standard
            transaction_currency_code=currency_config.code,
            transaction_type='credit',
            category='deposit',
            status='completed',
            description=f"Deposited {input_amount} {currency_config.code} converted to system base balance.",
            reference=unique_reference,
            payment_method=payment_method,
            payment_details=payment_details,
            completed_at=timezone.now()
        )

        return wallet, transaction_log