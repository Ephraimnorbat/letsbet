from celery import shared_task
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User
from apps.leaderboard.models import Leaderboard

@shared_task
def update_leaderboards():
    """
    Update leaderboard rankings
    """
    try:
        periods = ['daily', 'weekly', 'monthly', 'all_time']
        
        for period in periods:
            # Calculate date range based on period
            if period == 'daily':
                start_date = timezone.now() - timedelta(days=1)
            elif period == 'weekly':
                start_date = timezone.now() - timedelta(days=7)
            elif period == 'monthly':
                start_date = timezone.now() - timedelta(days=30)
            else:
                start_date = None
            
            # Get user stats
            users = User.objects.all()
            
            for user in users:
                # Calculate points based on user's betting performance
                profit = user.total_profit
                wins = user.total_wins
                
                # Simple points calculation (customize as needed)
                points = (profit * 100) + (wins * 10)
                
                # Update or create leaderboard entry
                leaderboard, created = Leaderboard.objects.update_or_create(
                    user=user,
                    period=period,
                    defaults={
                        'points': points,
                        'wins': wins,
                        'profit': profit,
                        'updated_at': timezone.now()
                    }
                )
            
            # Update ranks
            leaderboards = Leaderboard.objects.filter(period=period).order_by('-points')
            for index, entry in enumerate(leaderboards, 1):
                entry.rank = index
                entry.save()
        
        return "Leaderboards updated successfully"
    except Exception as e:
        return f"Error updating leaderboards: {str(e)}"