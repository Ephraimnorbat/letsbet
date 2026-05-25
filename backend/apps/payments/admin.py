from django.contrib import admin
from django.db import transaction as db_transaction
from django.utils import timezone
from .models import PaymentTransaction, TransactionLedger, WithdrawalRequest
from apps.wallet.models import Wallet, Transaction as WalletTransaction

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'withdrawal_method', 'status', 'created_at']
    list_filter = ['status', 'withdrawal_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'address_details']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['approve_withdrawals', 'reject_withdrawals']

    def save_model(self, request, obj, form, change):
        """
        Handles manual single-row updates inside the detail edit view.
        """
        if change and 'status' in form.changed_data:
            # Fetch the unedited instance from DB to verify the original state
            old_obj = WithdrawalRequest.objects.get(pk=obj.pk)
            if old_obj.status == 'pending':
                if obj.status == 'approved':
                    self._process_approval(obj)
                elif obj.status == 'rejected':
                    self._process_rejection(obj)
        
        super().save_model(request, obj, form, change)

    # --- Custom Admin Actions for Bulk Processing ---
    @admin.action(description="Approve selected pending withdrawals")
    def approve_withdrawals(self, request, queryset):
        pending_requests = queryset.filter(status='pending')
        count = 0
        for w_request in pending_requests:
            self._process_approval(w_request)
            w_request.status = 'approved'
            w_request.admin_notes = f"Bulk approved by {request.user.username} on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
            w_request.save()
            count += 1
        self.message_user(request, f"Successfully approved {count} withdrawal requests.")

    @admin.action(description="Reject selected pending withdrawals & refund users")
    def reject_withdrawals(self, request, queryset):
        pending_requests = queryset.filter(status='pending')
        count = 0
        for w_request in pending_requests:
            self._process_rejection(w_request)
            w_request.status = 'rejected'
            w_request.admin_notes = f"Bulk rejected by {request.user.username} on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
            w_request.save()
            count += 1
        self.message_user(request, f"Successfully rejected {count} withdrawal requests and refunded balances.")

    # --- Worker Core Logic Methods ---
    def _process_approval(self, w_request):
        """Confirms ledger entries since money was already deducted on request."""
        with db_transaction.atomic():
            WalletTransaction.objects.filter(
                reference=f"WTH-{w_request.id}", 
                status='pending'
            ).update(
                status='completed',
                completed_at=timezone.now()
            )

    def _process_rejection(self, w_request):
        """Refunds funds to the wallet block safely."""
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=w_request.user)
            
            # Revert the held funds
            wallet.balance += w_request.amount
            wallet.total_withdrawn -= w_request.amount
            wallet.save()

            # Update the user's transaction paper trail status
            WalletTransaction.objects.filter(
                reference=f"WTH-{w_request.id}"
            ).update(
                status='failed',
                description=f"Withdrawal to {w_request.withdrawal_method} Rejected"
            )


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'price_amount', 'price_currency', 'status', 'is_credited', 'created_at']
    list_filter = ['status', 'is_credited', 'price_currency']
    search_fields = ['order_id', 'payment_id', 'user__username']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(TransactionLedger)
class TransactionLedgerAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'balance_after', 'transaction_type', 'reference', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username', 'reference']
    readonly_fields = ['created_at']