from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import F, Sum
from .models import Leaderboard
from .serializers import LeaderboardSerializer, LeaderboardListSerializer

class TopLeaderboardView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LeaderboardListSerializer

    def get_queryset(self):
        period = self.request.query_params.get('period', 'weekly')
        return Leaderboard.objects.filter(period=period)[:50]

class WeeklyLeaderboardView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LeaderboardListSerializer

    def get_queryset(self):
        return Leaderboard.objects.filter(period='weekly').order_by('-points')[:100]

class MonthlyLeaderboardView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LeaderboardListSerializer

    def get_queryset(self):
        return Leaderboard.objects.filter(period='monthly').order_by('-points')[:100]

class AllTimeLeaderboardView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LeaderboardListSerializer

    def get_queryset(self):
        return Leaderboard.objects.filter(period='all_time').order_by('-points')[:100]

class UserLeaderboardRankView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeaderboardSerializer

    def get_object(self):
        period = self.request.query_params.get('period', 'weekly')
        try:
            return Leaderboard.objects.get(user=self.request.user, period=period)
        except Leaderboard.DoesNotExist:
            return None