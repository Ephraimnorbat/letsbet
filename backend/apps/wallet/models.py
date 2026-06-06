from django.db import models
from django.conf import settings
from decimal import Decimal

from apps.accounts.models import Currency

def get_default_currency():
    """
    Dynamically looks up and returns the default primary key 
    id for USD from the centralized accounts Currency table.
    """
    try:
        # Returns the integer primary key for USD (e.g., 2)
        return Currency.objects.get(code="USD").id
    except Currency.DoesNotExist:
        # Safe fallback for initial deployment phases
        return None

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    
    # Points securely to accounts.Currency with our new dynamic USD default handler
    currency = models.ForeignKey(
        Currency, 
        on_delete=models.PROTECT, 
        related_name='wallets',
        default=get_default_currency
    )
    
    # Financial metrics remain consistently tracked in system base values (KES)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deposited = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_won = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallets'

    def __str__(self):
        return f"{self.user.username} - Balance: {self.balance} KES (View: {self.currency.code})"

    @property
    def converted_balance(self):
        if self.currency.code == 'KES':
            return self.balance
        converted = self.balance * self.currency.exchange_rate_to_kes
        return converted.quantize(Decimal('0.01'))

    @property
    def converted_bonus_balance(self):
        if self.currency.code == 'KES':
            return self.bonus_balance
        converted = self.bonus_balance * self.currency.exchange_rate_to_kes
        return converted.quantize(Decimal('0.01'))


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]
    
    TRANSACTION_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    CATEGORY_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('bet_stake', 'Bet Stake'),
        ('bet_payout', 'Bet Payout'),
        ('refund', 'Refund'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    
    # Store transaction base metrics consistently in base KES values for unified balance accounting
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # ✅ OPTIONAL AUDIT TRACE: Capture tracking values at the exact moment of execution
    transaction_currency_code = models.CharField(max_length=3, default="KES", help_text="Snapshot of the currency code during payment execution")
    
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='pending')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='deposit')    
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, blank=True)
    payment_details = models.JSONField(default=dict)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['reference']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount} KES"