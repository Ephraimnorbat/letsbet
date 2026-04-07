import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

app = Celery('api')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks(['apps.accounts', 'apps.matches', 'apps.betting', 'apps.wallet', 'apps.leaderboard'])

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# Schedule tasks
app.conf.beat_schedule = {
    'update-exchange-rates-every-hour': {
        'task': 'apps.accounts.tasks.update_exchange_rates',
        'schedule': crontab(minute=0, hour='*/1'),  # Every hour
    },
    'update-live-matches-every-30-seconds': {
        'task': 'apps.matches.tasks.update_live_matches',
        'schedule': 30.0,  # Every 30 seconds
    },
    'update-leaderboards-daily': {
        'task': 'apps.leaderboard.tasks.update_leaderboards',
        'schedule': crontab(minute=0, hour=0),  # Midnight daily
    },
    'process-pending-transactions': {
        'task': 'apps.wallet.tasks.process_pending_transactions',
        'schedule': 300.0,  # Every 5 minutes
    },
    'cleanup-old-matches-daily': {
        'task': 'apps.matches.tasks.cleanup_old_matches',
        'schedule': crontab(minute=0, hour=2),  # 2 AM daily
    },
}