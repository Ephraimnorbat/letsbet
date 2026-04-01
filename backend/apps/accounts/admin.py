from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, UserProfile, LoginHistory

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('id', 'email', 'username', 'display_balance', 'total_bets', 'total_wins', 'is_verified', 'is_active')
    list_filter = ('is_verified', 'is_active', 'date_joined')
    search_fields = ('email', 'username', 'phone_number')
    readonly_fields = ('last_login', 'date_joined', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'date_of_birth', 'profile_picture')}),
        ('Referral', {'fields': ('referral_code', 'referred_by')}),
        ('Betting Stats', {'fields': ('total_bets', 'total_wins', 'total_losses', 'total_profit')}),
        ('Status', {'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )
    
    ordering = ('-date_joined',)
    
    def display_balance(self, obj):
        if hasattr(obj, 'wallet'):
            return format_html('<span style="color: green;">${:.2f}</span>', obj.wallet.balance)
        return format_html('<span style="color: gray;">No wallet</span>')
    display_balance.short_description = 'Balance'

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'country', 'kyc_status', 'created_at')
    list_filter = ('kyc_status', 'country')
    search_fields = ('user__email', 'user__username', 'city', 'country')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'login_time')
    list_filter = ('login_time',)
    search_fields = ('user__email', 'ip_address')
    readonly_fields = ('user', 'ip_address', 'user_agent', 'login_time')