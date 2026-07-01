from django.db import models
from django.conf import settings
from decimal import Decimal
import secrets
import string
from django.utils import timezone

from apps.accounts.models import Currency

def get_default_currency():
    """Kept for backward compatibility with existing migrations."""
    try:
        return Currency.objects.get(code="KES").id
    except Currency.DoesNotExist:
        return None

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    
    # Currency should be set from user's preferred_currency; no default to USD
    currency = models.ForeignKey(
        Currency, 
        on_delete=models.PROTECT, 
        related_name='wallets',
        null=True,  # Allow null temporarily for migration
        blank=True
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
        currency_code = self.currency.code if self.currency else 'KES'
        return f"{self.user.username} - Balance: {self.balance} KES (View: {currency_code})"

    def save(self, *args, **kwargs):
        # If no currency set, try to get from user's preferred currency
        if not self.currency and self.user:
            if hasattr(self.user, 'preferred_currency') and self.user.preferred_currency:
                self.currency = self.user.preferred_currency
            else:
                # Fallback to KES if user has no preferred currency
                try:
                    self.currency = Currency.objects.get(code='KES')
                except Currency.DoesNotExist:
                    # Last resort: try to get any currency
                    self.currency = Currency.objects.first()
        super().save(*args, **kwargs)

    @property
    def converted_balance(self):
        """Convert balance from KES to wallet's display currency"""
        if not self.currency:
            return self.balance
        if self.currency.code == 'KES':
            return self.balance
        # exchange_rate_to_kES = how many KES per 1 unit of this currency
        converted = self.balance / self.currency.exchange_rate_to_kES
        return converted.quantize(Decimal('0.01'))

    @property
    def converted_bonus_balance(self):
        if not self.currency:
            return self.bonus_balance
        if self.currency.code == 'KES':
            return self.bonus_balance
        converted = self.bonus_balance / self.currency.exchange_rate_to_kES
        return converted.quantize(Decimal('0.01'))

    @property
    def currency_symbol(self):
        return self.currency.symbol if self.currency else 'KSh'

    @property
    def currency_code(self):
        return self.currency.code if self.currency else 'KES'


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
    



class VoucherType(models.Model):
    """Types of vouchers (deposit, withdrawal, bonus)"""
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, unique=True)  # DEP, WTH, BON
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, default=1000000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'voucher_types'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class Voucher(models.Model):
    """Voucher model for deposits and withdrawals"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('used', 'Used'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('pending', 'Pending'),
    ]

    # Voucher details
    code = models.CharField(max_length=19, unique=True)    
    voucher_type = models.ForeignKey(VoucherType, on_delete=models.CASCADE, related_name='vouchers')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Generation details (vendor side)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='generated_vouchers'
    )
    vendor_name = models.CharField(max_length=100, blank=True)
    vendor_contact = models.CharField(max_length=50, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Redemption details (client side)
    redeemed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='redeemed_vouchers'
    )
    redeemed_at = models.DateTimeField(null=True, blank=True)
    
    # Transaction reference
    transaction = models.ForeignKey(
        'Transaction', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='vouchers'
    )
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vouchers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code', 'status']),
            models.Index(fields=['generated_by', 'status']),
        ]

    def __str__(self):
        return f"{self.code} - {self.amount} ({self.status})"
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_voucher_code()
        # ✅ Remove spaces before saving
        self.code = self.code.replace(' ', '')
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)

    @staticmethod
    def generate_voucher_code():
        """Generate a 16-digit voucher code with spaces: XXXX XXXX XXXX XXXX"""
        # Generate 16 random digits
        digits = ''.join(secrets.choice(string.digits) for _ in range(16))
        # Format as XXXX XXXX XXXX XXXX
        formatted = ' '.join(digits[i:i+4] for i in range(0, 16, 4))
        return formatted

    @property
    def formatted_code(self):
        # If code is stored without spaces, format it
        if len(self.code) == 16 and self.code.isdigit():
            return ' '.join(self.code[i:i+4] for i in range(0, 16, 4))
        # If it already has spaces, return as is
        return self.code

    def is_valid(self):
        """Check if voucher is valid for redemption"""
        return (
            self.status == 'active' and
            self.expires_at and
            self.expires_at > timezone.now()
        )

    def redeem(self, user):
        """Redeem voucher for a user"""
        if not self.is_valid():
            raise ValueError(f"Voucher is not valid (status: {self.status})")
        
        self.status = 'used'
        self.redeemed_by = user
        self.redeemed_at = timezone.now()
        self.save()
        
        return True

class VoucherAuditLog(models.Model):
    """Audit log for voucher activities"""
    ACTION_CHOICES = [
        ('generated', 'Generated'),
        ('viewed', 'Viewed'),
        ('redeemed', 'Redeemed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('failed', 'Failed'),
    ]
    
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'voucher_audit_logs'
        ordering = ['-created_at']