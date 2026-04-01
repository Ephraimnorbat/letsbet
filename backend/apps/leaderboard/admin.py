from django.contrib import admin
from .models import Leaderboard

@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'period', 'points', 'wins', 'profit', 'rank')
    list_filter = ('period',)
    search_fields = ('user__email', 'user__username')
    list_editable = ('points', 'rank')
    readonly_fields = ('updated_at',)
    
    fieldsets = (
        ('Leaderboard Info', {
            'fields': ('user', 'period', 'points', 'rank')
        }),
        ('Statistics', {
            'fields': ('wins', 'losses', 'profit')
        }),
        ('Metadata', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['update_rankings']
    
    def update_rankings(self, request, queryset):
        for period in ['daily', 'weekly', 'monthly', 'all_time']:
            entries = Leaderboard.objects.filter(period=period).order_by('-points')
            for index, entry in enumerate(entries, 1):
                entry.rank = index
                entry.save()
        self.message_user(request, 'Leaderboard rankings updated successfully.')
    update_rankings.short_description = 'Update rankings for selected periods'