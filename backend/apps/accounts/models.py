from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Add these new models before your existing User model
class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True)  # KES, USD, EUR, etc.
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=5)  # KSh, $, €
    exchange_rate_to_kES = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'currencies'
        verbose_name_plural = 'Currencies'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} ({self.symbol})"

class Country(models.Model):
    code = models.CharField(max_length=2, unique=True)  # KE, US, GB, etc.
    name = models.CharField(max_length=100)
    default_currency = models.ForeignKey(Currency, on_delete=models.SET_NULL, null=True, related_name='countries')
    phone_code = models.CharField(max_length=5, blank=True)
    flag = models.CharField(max_length=10, blank=True)  # Emoji flag
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'countries'
        verbose_name_plural = 'Countries'
        ordering = ['name']

    def __str__(self):
        return self.name

# Update your existing User model - add these two fields
class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    referral_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    # NEW FIELDS - Add these two
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    preferred_currency = models.ForeignKey(Currency, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    # Existing fields
    total_bets = models.IntegerField(default=0)
    total_wins = models.IntegerField(default=0)
    total_losses = models.IntegerField(default=0)
    total_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Auto-set preferred currency from country if not specified
        if not self.preferred_currency and self.country and self.country.default_currency:
            self.preferred_currency = self.country.default_currency
        super().save(*args, **kwargs)

# Your existing UserProfile remains the same (country field here is string, not foreign key)
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)  # This is a string field for user input
    postal_code = models.CharField(max_length=20, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')
    notification_preferences = models.JSONField(default=dict)
    kyc_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('verified', 'Verified'),
            ('rejected', 'Rejected')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

# Your existing LoginHistory remains the same
class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'login_history'
        ordering = ['-login_time']