from django.db import models
from django.conf import settings

class CurrencyRate(models.Model):
    # e.g., source="USD", target="KES", rate=132.50
    source = models.CharField(max_length=3, default="USD")
    target = models.CharField(max_length=3, unique=True)
    rate = models.DecimalField(max_digits=10, decimal_places=4)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'currency_rates'

    def __str__(self):
        return f"1 {self.source} = {self.rate} {self.target}"

class Wallet(models.Model):
    CURRENCY_CHOICES = [
        ('KES', 'Kenyan Shilling'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='KES') # New field
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Base amount always stored in KES
    bonus_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deposited = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_won = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallets'

    def __str__(self):
        return f"{self.user.username} - Balance: {self.balance} {self.currency}"

    @property
    def converted_balance(self):
        """Returns balance calculated on the fly into target currency"""
        if self.currency == 'KES':
            return self.balance
        try:
            # Frankfurter uses EUR as base, we store KES conversions
            rate_obj = CurrencyRate.objects.get(target=self.currency)
            kes_rate = CurrencyRate.objects.get(target='KES')
            # Cross rate math: amount_in_kes * (target_rate / kes_rate)
            return round(self.balance * (rate_obj.rate / kes_rate.rate), 2)
        except CurrencyRate.DoesNotExist:
            return self.balance

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
    # New categories to make filtering easier for the user
    CATEGORY_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('bet_stake', 'Bet Stake'),
        ('bet_payout', 'Bet Payout'),
        ('refund', 'Refund'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
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
        return f"{self.user.username} - {self.transaction_type} - {self.amount}"