from django.contrib import admin
from django.utils.html import format_html
from .models import Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance_display', 'currency', 'total_deposited_display', 'total_withdrawn_display')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

    def balance_display(self, obj):
        if obj.currency:
            return f"{obj.currency.symbol}{obj.balance:.2f}"
        return f"{obj.balance:.2f}"
    balance_display.short_description = 'Balance'

    def total_deposited_display(self, obj):
        if obj.currency:
            return f"{obj.currency.symbol}{obj.total_deposited:.2f}"
        return f"{obj.total_deposited:.2f}"
    total_deposited_display.short_description = 'Total Deposited'

    def total_withdrawn_display(self, obj):
        if obj.currency:
            return f"{obj.currency.symbol}{obj.total_withdrawn:.2f}"
        return f"{obj.total_withdrawn:.2f}"
    total_withdrawn_display.short_description = 'Total Withdrawn'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount_display', 'transaction_type', 'status', 'description', 'created_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('user__email', 'user__username', 'reference', 'description')
    readonly_fields = ('created_at',)
    
    def amount_display(self, obj):
        color = 'green' if obj.transaction_type == 'credit' else 'red'
        amount_str = f"{float(obj.amount):.2f}"
        return format_html(
            '<span style="color: {}; font-weight: bold;">${}</span>', 
            color, 
            amount_str
        )
    
    actions = ['mark_as_completed', 'mark_as_failed']
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='completed')
        self.message_user(request, f'{updated} transactions marked as completed.')
    mark_as_completed.short_description = 'Mark selected transactions as completed'
    
    def mark_as_failed(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='failed')
        self.message_user(request, f'{updated} transactions marked as failed.')
    mark_as_failed.short_description = 'Mark selected transactions as failed'