from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.contrib.auth.hashers import check_password

from .utils import generate_verification_token
from .tasks import update_exchange_rates
from .models import UserProfile, LoginHistory, Country, Currency
from .serializers import (
    UserSerializer, UserProfileSerializer, UserDetailSerializer,
    RegisterSerializer, ChangePasswordSerializer, LoginHistorySerializer, 
    LoginSerializer, CountrySerializer, CurrencySerializer
)

User = get_user_model()


# New views for countries and currencies
class CountryListView(generics.ListAPIView):
    """
    List all active countries
    """
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]

class CurrencyListView(generics.ListAPIView):
    """
    List all active currencies
    """
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = [AllowAny]

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()

        # 🔥 Ensure user is not verified
        user.is_verified = False
        user.save()

        uid, token = generate_verification_token(user)

        verification_link = f"http://localhost:3000/verify/{uid}/{token}"

        send_mail(
            "Verify your account",
            f"Click to verify: {verification_link}",
            "noreply@letsbet.com",
            [user.email],
            fail_silently=False,
        )

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            # 1. Fetch user by email
            user = User.objects.get(email=email)
            
            # 2. Check password directly
            if not check_password(password, user.password):
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
                
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # 3. Check Account Status
        if not user.is_active:
             return Response({"error": "Account is disabled"}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_verified:
            return Response({"error": "Please verify your email"}, status=status.HTTP_403_FORBIDDEN)

        # 4. Success - Create history
        LoginHistory.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255]
        )

        # 5. Handle Currency/Exchange Rate (New Schema Logic)
        # Fallback to KES if user has no preferred currency set
        currency = user.preferred_currency
        if not currency:
            currency, _ = Currency.objects.get_or_create(
                code='KES', 
                defaults={'name': 'Kenyan Shilling', 'symbol': 'KSh', 'exchange_rate_to_kES': 1.0}
            )
            user.preferred_currency = currency
            user.save()

        # 6. Generate Tokens
        refresh = RefreshToken.for_user(user)
        
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=user)

        return Response({
            "message": "Login successful",
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                # Flattened for your BettingSlip frontend:
                "currency_symbol": currency.symbol,
                "exchange_rate": float(currency.exchange_rate_to_kES),
            }
        }, status=status.HTTP_200_OK)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uid, token):
        try:
            uid = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=uid)

            if user.is_verified:
                return Response({'message': 'Account already verified'})

            if default_token_generator.check_token(user, token):
                user.is_verified = True
                user.save()
                return Response({'message': 'Email verified successfully'})
            else:
                return Response({'error': 'Invalid token'}, status=400)

        except Exception:
            return Response({'error': 'Invalid request'}, status=400)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserDetailSerializer

    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle country update
        if 'country_id' in request.data:
            try:
                country = Country.objects.get(id=request.data['country_id'], is_active=True)
                instance.country = country
                # Auto-update currency if not specified
                if 'preferred_currency_id' not in request.data and country.default_currency:
                    instance.preferred_currency = country.default_currency
            except Country.DoesNotExist:
                return Response({'error': 'Invalid country'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle currency update
        if 'preferred_currency_id' in request.data:
            try:
                currency = Currency.objects.get(id=request.data['preferred_currency_id'], is_active=True)
                instance.preferred_currency = currency
            except Currency.DoesNotExist:
                return Response({'error': 'Invalid currency'}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        
        # Handle country update
        if 'country_id' in request.data:
            try:
                country = Country.objects.get(id=request.data['country_id'], is_active=True)
                user.country = country
                # Auto-update currency if not specified
                if 'preferred_currency_id' not in request.data and country.default_currency:
                    user.preferred_currency = country.default_currency
            except Country.DoesNotExist:
                return Response({'error': 'Invalid country'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle currency update
        if 'preferred_currency_id' in request.data:
            try:
                currency = Currency.objects.get(id=request.data['preferred_currency_id'], is_active=True)
                user.preferred_currency = currency
            except Currency.DoesNotExist:
                return Response({'error': 'Invalid currency'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        
        if user_serializer.is_valid():
            user_serializer.save()
            
            # Update profile if data provided
            if 'profile' in request.data:
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile_serializer = UserProfileSerializer(profile, data=request.data['profile'], partial=True)
                if profile_serializer.is_valid():
                    profile_serializer.save()
            
            return Response({
                'user': user_serializer.data,
                'message': 'Profile updated successfully'
            })
        
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.data['old_password']):
                return Response({'old_password': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.data['new_password'])
            user.save()
            
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'message': 'Logged out successfully'})
        
class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get user's currency symbol
        currency_symbol = user.preferred_currency.symbol if user.preferred_currency else 'KSh'
        
        stats = {
            'total_bets': user.total_bets,
            'total_wins': user.total_wins,
            'total_losses': user.total_losses,
            'win_rate': round((user.total_wins / user.total_bets * 100), 2) if user.total_bets > 0 else 0,
            'total_profit': float(user.total_profit),
            'currency_symbol': currency_symbol,
            'member_since': user.date_joined,
            'country': {
                'name': user.country.name if user.country else None,
                'code': user.country.code if user.country else None,
            },
            'preferred_currency': {
                'code': user.preferred_currency.code if user.preferred_currency else None,
                'symbol': user.preferred_currency.symbol if user.preferred_currency else None,
                'name': user.preferred_currency.name if user.preferred_currency else None,
            }
        }
        
        return Response(stats)

class UpdateUserCountryCurrencyView(APIView):
    """
    Separate view for updating user's country and currency preferences
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        country_id = request.data.get('country_id')
        currency_id = request.data.get('currency_id')
        
        response_data = {}
        
        # Update country
        if country_id:
            try:
                country = Country.objects.get(id=country_id, is_active=True)
                user.country = country
                response_data['country'] = CountrySerializer(country).data
                
                # Auto-set currency to country's default if not specified
                if not currency_id and country.default_currency:
                    user.preferred_currency = country.default_currency
                    response_data['currency'] = CurrencySerializer(country.default_currency).data
                    
            except Country.DoesNotExist:
                return Response({'error': 'Invalid country'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update currency
        if currency_id:
            try:
                currency = Currency.objects.get(id=currency_id, is_active=True)
                user.preferred_currency = currency
                response_data['currency'] = CurrencySerializer(currency).data
            except Currency.DoesNotExist:
                return Response({'error': 'Invalid currency'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.save()
        
        return Response({
            'message': 'Preferences updated successfully',
            **response_data
        }, status=status.HTTP_200_OK)

class GetUserPreferencesView(APIView):
    """
    Get user's current country and currency preferences
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        return Response({
            'country': CountrySerializer(user.country).data if user.country else None,
            'currency': CurrencySerializer(user.preferred_currency).data if user.preferred_currency else None,
            'available_countries': CountrySerializer(Country.objects.filter(is_active=True), many=True).data,
            'available_currencies': CurrencySerializer(Currency.objects.filter(is_active=True), many=True).data,
        })
    


class ExchangeRatesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Try to get cached rates
        rates = cache.get('exchange_rates')
        
        if not rates:
            # Trigger async update and return loading status
            update_exchange_rates.delay()
            return Response({
                'status': 'updating',
                'message': 'Exchange rates are being updated. Please try again in a moment.'
            }, status=status.HTTP_202_ACCEPTED)
        
        base_currency = request.query_params.get('base', 'KES')
        
        return Response({
            'base': base_currency,
            'rates': rates,
            'updated_at': cache.get('exchange_rates_timestamp')
        })