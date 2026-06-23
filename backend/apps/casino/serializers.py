from rest_framework import generics, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Sum
from decimal import Decimal
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import CrashGameRound, CrashBet

# --- SERIALIZERS ---
class CrashGameRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrashGameRound
        fields = ['id', 'round_number', 'crash_point', 'status', 'created_at']


class CrashBetHistorySerializer(serializers.ModelSerializer):
    # Change BigIntegerField to IntegerField 👇
    round_number = serializers.IntegerField(source='game_round.round_number', read_only=True)
    crash_point = serializers.DecimalField(source='game_round.crash_point', max_digits=7, decimal_places=2, read_only=True)

    class Meta:
        model = CrashBet
        fields = ['id', 'round_number', 'stake', 'cashout_multiplier', 'payout', 'status', 'crash_point', 'created_at']