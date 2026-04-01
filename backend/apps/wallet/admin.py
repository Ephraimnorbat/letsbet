from django.contrib import admin
from django.utils.html import format_html
from .models import Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_balance', 'bonus_balance', 'total_deposited', 'total_withdrawn', 'total_won')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    
    def display_balance(self, obj):
        return format_html('<span style="color: green; font-weight: bold;">${:.2f}</span>', obj.balance)
    display_balance.short_description = 'Balance'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount_display', 'transaction_type', 'status', 'description', 'created_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('user__email', 'user__username', 'reference', 'description')
    readonly_fields = ('created_at',)
    
    def amount_display(self, obj):
        color = 'green' if obj.transaction_type == 'credit' else 'red'
        return format_html('<span style="color: {};">${:.2f}</span>', color, obj.amount)
    amount_display.short_description = 'Amount'
    
    actions = ['mark_as_completed', 'mark_as_failed']
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='completed')
        self.message_user(request, f'{updated} transactions marked as completed.')
    mark_as_completed.short_description = 'Mark selected transactions as completed'
    
    def mark_as_failed(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='failed')
        self.message_user(request, f'{updated} transactions marked as failed.')
    mark_as_failed.short_description = 'Mark selected transactions as failed'