from django.db import models
from django.conf import settings
import uuid
from apps.accounts.models import Currency

User = settings.AUTH_USER_MODEL


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('confirming', 'Confirming'),
        ('confirmed', 'Confirmed'),
        ('finished', 'Finished'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    # Your system
    order_id = models.CharField(max_length=100, unique=True)
    
    # NOWPayments
    payment_id = models.CharField(max_length=255, blank=True, null=True)
    pay_address = models.CharField(max_length=255, blank=True, null=True)
    
    price_amount = models.DecimalField(max_digits=12, decimal_places=2)  # USD
    price_currency = models.CharField(max_length=10, default='usd')
    
    pay_amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    pay_currency = models.CharField(max_length=10, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    
    is_credited = models.BooleanField(default=False)  # 🔥 prevent double credit
    
    raw_response = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_id} - {self.status}"
    


class TransactionLedger(models.Model):
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('bet', 'Bet'),
        ('win', 'Win'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    
    reference = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transaction_ledger'
        ordering = ['-created_at']




    
class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.ForeignKey('accounts.Currency', on_delete=models.CASCADE, null=True, blank=True)
    withdrawal_method = models.CharField(max_length=50)
    address_details = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # ✅ Only set currency if not already set AND if it's not a string
        if not self.currency and self.user:
            try:
                # Get the user's preferred currency
                if hasattr(self.user, 'preferred_currency') and self.user.preferred_currency:
                    # If it's already a Currency object, use it directly
                    if isinstance(self.user.preferred_currency, Currency):
                        self.currency = self.user.preferred_currency
                    else:
                        # If it's a string (like 'usd'), look up the Currency object
                        from apps.accounts.models import Currency
                        try:
                            self.currency = Currency.objects.get(code__iexact=str(self.user.preferred_currency))
                        except Currency.DoesNotExist:
                            # Fallback to KES
                            self.currency = Currency.objects.get(code='KES')
                else:
                    # Fallback to KES
                    from apps.accounts.models import Currency
                    self.currency = Currency.objects.get(code='KES')
            except Exception as e:
                print(f"Error setting currency for withdrawal {self.id}: {e}")
                # Last resort: try to get any currency
                from apps.accounts.models import Currency
                self.currency = Currency.objects.first()
        
        super().save(*args, **kwargs)