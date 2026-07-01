from rest_framework import serializers
from .models import Wallet, Transaction, Voucher, VoucherType, VoucherAuditLog

class WalletSerializer(serializers.ModelSerializer):
    currency_symbol = serializers.SerializerMethodField()
    currency_code = serializers.SerializerMethodField()
    converted_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Wallet
        fields = [
            'balance', 
            'bonus_balance', 
            'total_deposited', 
            'total_withdrawn', 
            'total_won',
            'currency',
            'currency_symbol',
            'currency_code',
            'converted_balance',
        ]
    
    def get_currency_symbol(self, obj):
        return obj.currency_symbol
    
    def get_currency_code(self, obj):
        return obj.currency_code

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user', 'reference', 'created_at']

class DepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    payment_method = serializers.CharField(max_length=50)

class WithdrawSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=10)
    bank_account = serializers.CharField(max_length=100)


class VoucherTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherType
        fields = '__all__'

class VoucherSerializer(serializers.ModelSerializer):
    voucher_type_name = serializers.CharField(source='voucher_type.name', read_only=True)
    redeemed_by_username = serializers.CharField(source='redeemed_by.username', read_only=True, default=None)
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True, default=None)
    formatted_code = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'formatted_code', 'voucher_type', 'voucher_type_name',
            'amount', 'currency', 'status', 'vendor_name', 'vendor_contact',
            'generated_by', 'generated_by_username', 'generated_at',
            'redeemed_by', 'redeemed_by_username', 'redeemed_at',
            'expires_at', 'transaction', 'metadata', 'created_at'
        ]
        read_only_fields = ['code', 'status', 'generated_at', 'created_at', 'updated_at']

    def get_formatted_code(self, obj):
        """Return the voucher code with spaces: XXXX XXXX XXXX XXXX"""
        # If code has spaces, use it directly
        if ' ' in obj.code:
            return obj.code
        # Otherwise, format it
        clean = obj.code.replace(' ', '')
        if len(clean) == 16:
            return ' '.join(clean[i:i+4] for i in range(0, 16, 4))
        return obj.code

class VoucherCreateSerializer(serializers.Serializer):
    """Serializer for creating vouchers (vendor side)"""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    voucher_type_id = serializers.IntegerField()
    vendor_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    vendor_contact = serializers.CharField(max_length=50, required=False, allow_blank=True)
    currency = serializers.CharField(max_length=3, required=False, default='KES')  # Make optional
    expires_in_days = serializers.IntegerField(default=7, min_value=1, max_value=30)

    def validate_voucher_type_id(self, value):
        try:
            VoucherType.objects.get(id=value, is_active=True)
        except VoucherType.DoesNotExist:
            raise serializers.ValidationError("Invalid voucher type")
        return value

class VoucherRedeemSerializer(serializers.Serializer):
    """Serializer for redeeming vouchers (client side)"""
    code = serializers.CharField(max_length=19)
    
    def validate_code(self, value):
        # Remove spaces for validation
        clean_code = value.replace(' ', '')
        if len(clean_code) != 16 or not clean_code.isdigit():
            raise serializers.ValidationError("Invalid voucher code format")
        return clean_code
    
    def to_representation(self, instance):
        # If you need to return formatted code in response
        data = super().to_representation(instance)
        if 'code' in data:
            clean = data['code'].replace(' ', '')
            data['formatted_code'] = ' '.join(clean[i:i+4] for i in range(0, 16, 4))
        return data

class VoucherAuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, default=None)
    voucher_code = serializers.CharField(source='voucher.code', read_only=True)
    
    class Meta:
        model = VoucherAuditLog
        fields = '__all__'
        read_only_fields = ['created_at']