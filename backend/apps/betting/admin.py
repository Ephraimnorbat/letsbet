from django.contrib import admin
from django.utils.html import format_html
from .models import BetType, Bet, BetSlip

@admin.register(BetType)
class BetTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    list_editable = ('is_active',)

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'match_display', 'selection', 'odds', 'stake', 'potential_win', 'status')
    list_filter = ('status', 'bet_type', 'created_at')
    search_fields = ('user__email', 'user__username', 'match__home_team__name', 'match__away_team__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Bet Info', {
            'fields': ('user', 'match', 'bet_type', 'selection', 'odds', 'stake', 'potential_win')
        }),
        ('Status', {
            'fields': ('status', 'result', 'settled_at')
        }),
        ('Parlay', {
            'fields': ('is_parlay', 'parlay_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def match_display(self, obj):
        return f"{obj.match.home_team.name} vs {obj.match.away_team.name}"
    match_display.short_description = 'Match'
    
    actions = ['mark_as_won', 'mark_as_lost', 'mark_as_cancelled']
    
    def mark_as_won(self, request, queryset):
        from apps.wallet.models import Wallet, Transaction
        updated = 0
        for bet in queryset:
            if bet.status == 'pending':
                bet.status = 'won'
                bet.save()
                
                # Add winnings to wallet
                wallet = Wallet.objects.get(user=bet.user)
                wallet.balance += bet.potential_win
                wallet.total_won += bet.potential_win
                wallet.save()
                
                # Update user stats
                bet.user.total_wins += 1
                bet.user.total_profit += bet.potential_win - bet.stake
                bet.user.save()
                
                # Create transaction
                Transaction.objects.create(
                    user=bet.user,
                    amount=bet.potential_win,
                    transaction_type='credit',
                    status='completed',
                    description=f'Bet won: {bet.match}',
                    reference=f'WIN_{bet.id}'
                )
                updated += 1
        self.message_user(request, f'{updated} bets marked as won.')
    mark_as_won.short_description = 'Mark selected bets as won'
    
    def mark_as_lost(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='lost')
        for bet in queryset.filter(status='pending'):
            bet.user.total_losses += 1
            bet.user.save()
        self.message_user(request, f'{updated} bets marked as lost.')
    mark_as_lost.short_description = 'Mark selected bets as lost'
    
    def mark_as_cancelled(self, request, queryset):
        from apps.wallet.models import Wallet, Transaction
        updated = 0
        for bet in queryset.filter(status='pending'):
            bet.status = 'cancelled'
            bet.save()
            
            # Refund stake
            wallet = Wallet.objects.get(user=bet.user)
            wallet.balance += bet.stake
            wallet.save()
            
            # Create refund transaction
            Transaction.objects.create(
                user=bet.user,
                amount=bet.stake,
                transaction_type='credit',
                status='completed',
                description=f'Bet cancelled: {bet.match}',
                reference=f'REFUND_{bet.id}'
            )
            updated += 1
        self.message_user(request, f'{updated} bets cancelled and refunded.')
    mark_as_cancelled.short_description = 'Cancel selected bets (refund stake)'

@admin.register(BetSlip)
class BetSlipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_odds', 'total_stake', 'potential_win', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('bets',)