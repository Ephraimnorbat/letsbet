from django.contrib import admin
from django.utils.html import format_html
from .models import Sport, League, Team, Match, MatchEvent

@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'display_icon', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    list_editable = ('is_active',)
    
    def display_icon(self, obj):
        if obj.icon:
            return format_html('<img src="{}" width="40" height="40" />', obj.icon.url)
        return "No Icon"
    display_icon.short_description = 'Icon'

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'sport', 'country', 'is_active', 'created_at')
    list_filter = ('sport', 'country', 'is_active')
    search_fields = ('name', 'country')
    list_editable = ('is_active',)

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'short_name', 'league', 'founded_year')
    list_filter = ('league',)
    search_fields = ('name', 'short_name')
    list_editable = ('short_name',)

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'match_display', 'league', 'status', 'score_display', 'match_date')
    list_filter = ('status', 'league', 'match_date')
    search_fields = ('home_team__name', 'away_team__name', 'league__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Match Info', {
            'fields': ('league', 'home_team', 'away_team', 'match_date', 'status')
        }),
        ('Scores', {
            'fields': ('home_score', 'away_score', 'halftime_home_score', 'halftime_away_score')
        }),
        ('Statistics', {
            'fields': ('home_shots', 'away_shots', 'home_possession', 'away_possession')
        }),
        ('Odds', {
            'fields': ('home_odds', 'draw_odds', 'away_odds')
        }),
        ('Metadata', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def match_display(self, obj):
        return format_html(
            '<strong>{}</strong> vs <strong>{}</strong>',
            obj.home_team.name,
            obj.away_team.name
        )
    match_display.short_description = 'Match'
    
    def score_display(self, obj):
        if obj.status in ['live', 'finished']:
            return format_html(
                '<span style="color: green;">{} - {}</span>',
                obj.home_score,
                obj.away_score
            )
        return ' - '
    score_display.short_description = 'Score'
    
    actions = ['mark_as_finished', 'mark_as_cancelled']
    
    def mark_as_finished(self, request, queryset):
        updated = queryset.update(status='finished')
        self.message_user(request, f'{updated} matches marked as finished.')
    mark_as_finished.short_description = 'Mark selected matches as finished'
    
    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} matches marked as cancelled.')
    mark_as_cancelled.short_description = 'Mark selected matches as cancelled'

@admin.register(MatchEvent)
class MatchEventAdmin(admin.ModelAdmin):
    list_display = ('match', 'event_type', 'team', 'player_name', 'minute')
    list_filter = ('event_type', 'match__league')
    search_fields = ('player_name', 'match__home_team__name', 'match__away_team__name')
    list_editable = ('minute',)