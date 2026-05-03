from django.contrib import admin
from .models import BetType, Bet, BetSlip

# This allows you to see the matches inside the BetSlip detail page
class BetInline(admin.TabularInline):
    model = Bet
    extra = 0
    readonly_fields = ('match', 'selection', 'odds', 'status')
    can_delete = False

@admin.register(BetSlip)
class BetSlipAdmin(admin.ModelAdmin):
    # Removed 'is_active' and 'updated_at' which caused the E108, E116, and E035 errors
    list_display = ('id', 'user', 'total_stake', 'total_odds', 'potential_win', 'status', 'created_at')
    list_filter = ('status', 'created_at') # Fixed E116 (is_active was removed)
    search_fields = ('user__username', 'id')
    
    # We use an inline instead of filter_horizontal because we changed 
    # the relationship from ManyToMany to ForeignKey in the Bet model.
    # This fixes E019.
    inlines = [BetInline]
    
    # Updated readonly_fields to match current model (E035 fix)
    readonly_fields = ('created_at',)

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'match', 'selection', 'odds', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'match__home_team__name', 'match__away_team__name')

@admin.register(BetType)
class BetTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')