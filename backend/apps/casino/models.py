from django.db import models
from django.conf import settings
import uuid

class CrashGameRound(models.Model):
    STATUS_CHOICES = [
        ('lobby', 'Lobby (Accepting Bets)'),
        ('running', 'Plane Flying'),
        ('crashed', 'Crashed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round_number = models.BigIntegerField(unique=True, editable=False)
    crash_point = models.DecimalField(max_digits=7, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='lobby')
    
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crash_game_rounds'
        ordering = ['-created_at']

    def __str__(self):
        return f"Round #{self.round_number} - {self.status} (Crashed at {self.crash_point}x)"


class CrashBet(models.Model):
    STATUS_CHOICES = [
        ('placed', 'Placed'),
        ('cashed_out', 'Cashed Out'),
        ('lost', 'Lost'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crash_bets')
    game_round = models.ForeignKey(CrashGameRound, on_delete=models.CASCADE, related_name='bets')
    
    stake = models.DecimalField(max_digits=12, decimal_places=2)
    cashout_multiplier = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    payout = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')
    
    created_at = models.DateTimeField(auto_now_add=True)
    cashed_out_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crash_bets'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['game_round']),
        ]

    def __str__(self):
        return f"{self.user.username} - KSh {self.stake} on Round #{self.game_round.round_number}"