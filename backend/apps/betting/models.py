
import string
import random
from django.db import models
from django.conf import settings
from django.db import models

from apps.matches.models import Match

class BetType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bet_types'

    def __str__(self):
        return self.name
    


class BetSlip(models.Model):
    SLIP_STATUS = [
        ('pending', 'Pending'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('cashed_out', 'Cashed Out'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bet_slips')
    total_odds = models.DecimalField(max_digits=12, decimal_places=2)
    total_stake = models.DecimalField(max_digits=12, decimal_places=2)
    potential_win = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=SLIP_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bet_slips'
        ordering = ['-created_at']


class Bet(models.Model):
    BET_STATUS = [
        ('pending', 'Pending'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('cancelled', 'Cancelled'),
        ('cashed_out', 'Cashed Out'),
    ]
    slip = models.ForeignKey(BetSlip, on_delete=models.CASCADE, related_name='selections', null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bets')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='bets')
    bet_type = models.ForeignKey(BetType, on_delete=models.CASCADE)
    selection = models.CharField(max_length=50)  # home, draw, away, over, under, etc.
    odds = models.DecimalField(max_digits=5, decimal_places=2)
    stake = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    potential_win = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=BET_STATUS, default='pending')
    
    # For parlay bets
    is_parlay = models.BooleanField(default=False)
    parlay_id = models.CharField(max_length=100, null=True, blank=True)
    
    result = models.CharField(max_length=50, blank=True)
    settled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['match', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.match} - {self.stake}"
    



def generate_share_code():
    """Generates a secure 6-character alphanumeric code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not SharedBetslip.objects.filter(code=code).exists():
            return code

class SharedBetslip(models.Model):
    code = models.CharField(max_length=10, unique=True, default=generate_share_code)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Stores the raw array of structural odds market data chosen by the user
    # e.g., [{"match_id": 482, "market_type": "1X2", "selected_outcome": "Home", "odds": 2.15}]
    selections_payload = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shared_betslips'
        ordering = ['-created_at']

    def __str__(self):
        return f"Betslip Code: {self.code}"

