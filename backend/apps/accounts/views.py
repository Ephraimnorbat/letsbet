from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.cache import cache


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
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create auth token for the user
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                # Get or create token
                token, created = Token.objects.get_or_create(user=user)
                
                # Update last login
                user.last_login = timezone.now()
                user.save()
                
                # Log login history
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0]
                else:
                    ip = request.META.get('REMOTE_ADDR')
                
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                LoginHistory.objects.create(
                    user=user,
                    ip_address=ip,
                    user_agent=user_agent
                )
                
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        # Delete the user's token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
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