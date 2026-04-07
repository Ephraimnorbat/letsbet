from django.urls import path
from . import views

urlpatterns = [
    # Country and Currency endpoints
    path('countries/', views.CountryListView.as_view(), name='countries'),
    path('currencies/', views.CurrencyListView.as_view(), name='currencies'),
    path('exchange-rates/', views.ExchangeRatesView.as_view(), name='exchange-rates'),
    
    # Auth endpoints
    path('login/', views.LoginView.as_view(), name='login'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/update/', views.UpdateProfileView.as_view(), name='update-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    
    # New preferences endpoints
    path('preferences/', views.GetUserPreferencesView.as_view(), name='user-preferences'),
    path('preferences/update/', views.UpdateUserCountryCurrencyView.as_view(), name='update-preferences'),
]