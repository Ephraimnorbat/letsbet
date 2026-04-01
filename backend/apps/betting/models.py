from django.db import models
from django.conf import settings
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

class Bet(models.Model):
    BET_STATUS = [
        ('pending', 'Pending'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('cancelled', 'Cancelled'),
        ('cashed_out', 'Cashed Out'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bets')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='bets')
    bet_type = models.ForeignKey(BetType, on_delete=models.CASCADE)
    selection = models.CharField(max_length=50)  # home, draw, away, over, under, etc.
    odds = models.DecimalField(max_digits=5, decimal_places=2)
    stake = models.DecimalField(max_digits=10, decimal_places=2)
    potential_win = models.DecimalField(max_digits=10, decimal_places=2)
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

class BetSlip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bet_slips')
    bets = models.ManyToManyField(Bet, related_name='bet_slips')
    total_odds = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_stake = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    potential_win = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bet_slips'
        ordering = ['-created_at']