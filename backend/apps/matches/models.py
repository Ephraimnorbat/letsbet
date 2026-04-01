from django.db import models

class Sport(models.Model):
    name = models.CharField(max_length=100)
    icon = models.ImageField(upload_to='sports/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sports'
        ordering = ['name']

    def __str__(self):
        return self.name

class League(models.Model):
    name = models.CharField(max_length=200)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='leagues')
    country = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='leagues/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'leagues'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.country})"

class Team(models.Model):
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=50)
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='teams')
    logo = models.ImageField(upload_to='teams/', null=True, blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    stadium = models.CharField(max_length=200, blank=True)
    coach = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teams'
        ordering = ['name']

    def __str__(self):
        return self.name

class Match(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('halftime', 'Half Time'),
        ('finished', 'Finished'),
        ('cancelled', 'Cancelled'),
        ('postponed', 'Postponed'),
    ]
    
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='matches')
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    match_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Scores
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    halftime_home_score = models.IntegerField(default=0)
    halftime_away_score = models.IntegerField(default=0)
    
    # Match stats
    home_shots = models.IntegerField(default=0)
    away_shots = models.IntegerField(default=0)
    home_possession = models.IntegerField(default=0)
    away_possession = models.IntegerField(default=0)
    
    # Odds
    home_odds = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    draw_odds = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    away_odds = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'matches'
        ordering = ['-match_date']
        indexes = [
            models.Index(fields=['match_date', 'status']),
            models.Index(fields=['league', 'status']),
        ]

    def __str__(self):
        return f"{self.home_team.name} vs {self.away_team.name}"

class MatchEvent(models.Model):
    EVENT_TYPES = [
        ('goal', 'Goal'),
        ('yellow_card', 'Yellow Card'),
        ('red_card', 'Red Card'),
        ('substitution', 'Substitution'),
        ('penalty', 'Penalty'),
        ('injury', 'Injury'),
        ('offside', 'Offside'),
        ('corner', 'Corner'),
    ]
    
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    player_name = models.CharField(max_length=100)
    minute = models.IntegerField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'match_events'
        ordering = ['minute']

    def __str__(self):
        return f"{self.minute}' - {self.team.name}: {self.event_type}"