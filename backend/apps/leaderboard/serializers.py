from rest_framework import serializers
from .models import Leaderboard
from apps.accounts.serializers import UserSerializer

class LeaderboardSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Leaderboard
        fields = ['id', 'user', 'username', 'period', 'points', 'wins', 
                 'losses', 'profit', 'rank', 'user_details']

class LeaderboardListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    
    class Meta:
        model = Leaderboard
        fields = ['rank', 'username', 'points', 'wins', 'profit']