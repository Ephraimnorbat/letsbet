# account/views.py

from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework.generics import ListAPIView
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils.encoding import force_str
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.contrib.auth.hashers import check_password


from django.conf import settings
from .helpers import resolve_user_currency
from .utils import generate_verification_token
from .tasks import update_exchange_rates
from .models import UserProfile, LoginHistory, Country, Currency
from .serializers import (
    UserSerializer, UserProfileSerializer, UserDetailSerializer,
    RegisterSerializer, ChangePasswordSerializer, LoginHistorySerializer, 
    LoginSerializer, CountrySerializer, CurrencySerializer
)

User = get_user_model()


class CountryListView(generics.ListAPIView):
    """
    List all active countries - completely unpaginated for clean dropdown population
    """
    queryset = Country.objects.filter(is_active=True).order_by('name')
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Explicitly kills pagination context for frontend drops
    throttle_classes = ()


class CurrencyListView(generics.ListAPIView):
    """
    List all active currencies - completely unpaginated for clean dropdown population
    """
    queryset = Currency.objects.filter(is_active=True).order_by('code')
    serializer_class = CurrencySerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Explicitly kills pagination context for frontend drops
    throttle_classes = ()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()

        user.is_verified = False
        user.save()

        uid, token = generate_verification_token(user)
        verification_link = (
            f"{settings.MAIN_URL}/verify/{uid}/{token}"
        )

        send_mail(
            "Verify your account",
            f"Click to verify: {verification_link}",
            settings.DEFAULT_FROM_EMAIL,
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
            user = User.objects.get(email=email)
            if not check_password(password, user.password):
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({"error": "Account is disabled"}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_verified:
            return Response({"error": "Please verify your email"}, status=status.HTTP_403_FORBIDDEN)

        LoginHistory.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255]
        )

        # Fallback evaluation via your helper module
        currency = resolve_user_currency(user.country, user.preferred_currency)

        if not user.preferred_currency:
            user.preferred_currency = currency
            user.save()

        refresh = RefreshToken.for_user(user)
        UserProfile.objects.get_or_create(user=user)

        return Response({
            "message": "Login successful",
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "currency_symbol": currency.symbol,
                "exchange_rate": float(currency.exchange_rate_to_kES),
                "currency_code": currency.code,  
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        }, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')

        if not uidb64 or not token:
            return Response({'error': 'Missing verification parameters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Decode the user ID from base64
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        # Verify the token against your token generator logic
        # (Replace default_token_generator if you use a custom one inside generate_verification_token)
        if user is not None and default_token_generator.check_token(user, token):
            if user.is_verified:
                return Response({'message': 'Account already verified. Please log in.'}, status=status.HTTP_200_OK)
            
            user.is_verified = True
            user.save()
            return Response({'message': 'Account successfully verified!'}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid or expired verification token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserDetailSerializer

    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        # Support partial updates (PATCH) smoothly
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle phone numbers and basic field overrides directly from request payload safely
        if 'phone_number' in request.data:
            instance.phone_number = request.data.get('phone_number')
        if 'date_of_birth' in request.data:
            instance.date_of_birth = request.data.get('date_of_birth')

        # Handle relational items safely
        if 'country_id' in request.data and request.data['country_id']:
            try:
                country = Country.objects.get(id=request.data['country_id'], is_active=True)
                instance.country = country
            except Country.DoesNotExist:
                return Response({'error': 'Invalid country selection'}, status=status.HTTP_400_BAD_REQUEST)
        
        if 'preferred_currency_id' in request.data and request.data['preferred_currency_id']:
            try:
                currency = Currency.objects.get(id=request.data['preferred_currency_id'], is_active=True)
                instance.preferred_currency = currency
            except Currency.DoesNotExist:
                return Response({'error': 'Invalid currency selection'}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.save()
        
        # If your UserProfile model fields need changes, update them here via request.data.get('profile')
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        
        if 'country_id' in request.data:
            try:
                country = Country.objects.get(id=request.data['country_id'], is_active=True)
                user.country = country
            except Country.DoesNotExist:
                return Response({'error': 'Invalid country'}, status=status.HTTP_400_BAD_REQUEST)
        
        if 'preferred_currency_id' in request.data:
            try:
                currency = Currency.objects.get(id=request.data['preferred_currency_id'], is_active=True)
                user.preferred_currency = currency
            except Currency.DoesNotExist:
                return Response({'error': 'Invalid currency'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
            
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
            if not user.check_password(serializer.data['old_password']):
                return Response({'old_password': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
            
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
        currency = resolve_user_currency(user.country, user.preferred_currency)
        
        stats = {
            'total_bets': user.total_bets,
            'total_wins': user.total_wins,
            'total_losses': user.total_losses,
            'win_rate': round((user.total_wins / user.total_bets * 100), 2) if user.total_bets > 0 else 0,
            'total_profit': float(user.total_profit),
            'currency_symbol': currency.symbol,
            'member_since': user.date_joined,
            'country': {
                'name': user.country.name if user.country else None,
                'code': user.country.code if user.country else None,
            },
            'preferred_currency': {
                'code': currency.code,
                'symbol': currency.symbol,
                'name': currency.name,
            }
        }
        return Response(stats)


class UpdateUserCountryCurrencyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        country_id = request.data.get('country_id')
        currency_id = request.data.get('currency_id')
        response_data = {}
        
        if country_id:
            try:
                country = Country.objects.get(id=country_id, is_active=True)
                user.country = country
                response_data['country'] = CountrySerializer(country).data
            except Country.DoesNotExist:
                return Response({'error': 'Invalid country'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        rates = cache.get('exchange_rates')
        if not rates:
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