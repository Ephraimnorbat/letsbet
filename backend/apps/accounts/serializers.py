from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, LoginHistory, Country, Currency

User = get_user_model()

# Add these new serializers
class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'exchange_rate_to_kES']

class CountrySerializer(serializers.ModelSerializer):
    default_currency_details = CurrencySerializer(source='default_currency', read_only=True)
    
    class Meta:
        model = Country
        fields = ['id', 'code', 'name', 'phone_code', 'flag', 'default_currency', 'default_currency_details']

# Update your existing UserSerializer
class UserSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_code = serializers.CharField(source='country.code', read_only=True)
    currency_code = serializers.CharField(source='preferred_currency.code', read_only=True)
    currency_symbol = serializers.CharField(source='preferred_currency.symbol', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'date_of_birth',
                 'profile_picture', 'is_verified', 'total_bets', 'total_wins',
                 'total_losses', 'total_profit', 'date_joined',
                 'country', 'country_name', 'country_code',
                 'preferred_currency', 'currency_code', 'currency_symbol']
        read_only_fields = ['id', 'is_verified', 'total_bets', 'total_wins',
                           'total_losses', 'total_profit', 'date_joined']

# Keep your existing LoginSerializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required")
        
        return data

# Keep your existing UserProfileSerializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

# Update UserDetailSerializer
class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    country_details = CountrySerializer(source='country', read_only=True)
    currency_details = CurrencySerializer(source='preferred_currency', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'date_of_birth',
                 'profile_picture', 'is_verified', 'total_bets', 'total_wins',
                 'total_losses', 'total_profit', 'date_joined', 'profile',
                 'country', 'country_details', 'preferred_currency', 'currency_details']
        read_only_fields = fields

# Update RegisterSerializer to include country and currency
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    country_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    preferred_currency_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'phone_number',
                 'country_id', 'preferred_currency_id']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        
        # Validate country if provided
        if 'country_id' in data and data['country_id']:
            try:
                country = Country.objects.get(id=data['country_id'], is_active=True)
                data['country'] = country
            except Country.DoesNotExist:
                raise serializers.ValidationError({"country_id": "Invalid country selected"})
        
        # Validate currency if provided, otherwise use country's default
        if 'preferred_currency_id' in data and data['preferred_currency_id']:
            try:
                currency = Currency.objects.get(id=data['preferred_currency_id'], is_active=True)
                data['preferred_currency'] = currency
            except Currency.DoesNotExist:
                raise serializers.ValidationError({"preferred_currency_id": "Invalid currency selected"})
        elif 'country' in data and data['country'].default_currency:
            data['preferred_currency'] = data['country'].default_currency
        
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        if 'country_id' in validated_data:
            validated_data.pop('country_id')
        if 'preferred_currency_id' in validated_data:
            validated_data.pop('preferred_currency_id')
        
        country = validated_data.pop('country', None)
        currency = validated_data.pop('preferred_currency', None)
        password = validated_data.pop('password')
        
        user = User(**validated_data)
        user.set_password(password)
        
        if country:
            user.country = country
        if currency:
            user.preferred_currency = currency
        
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user

# Keep your existing LoginHistorySerializer
class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = '__all__'
        read_only_fields = ['user', 'login_time']

# Keep your existing ChangePasswordSerializer
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data