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

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['currency_symbol', 'exchange_rate', 'country'] # Explicitly include these
        read_only_fields = ['user', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    # Nest the profile data so the frontend 'User' interface is satisfied
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if not data.get('email') or not data.get('password'):
            raise serializers.ValidationError("Email and password are required")
        return data

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
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists"})
        
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
        user.is_verified = False
        user.set_password(password)
        user.email = user.email.lower()
        
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