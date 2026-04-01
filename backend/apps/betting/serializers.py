from rest_framework import serializers
from .models import BetType, Bet, BetSlip
from apps.matches.serializers import MatchSerializer

class BetTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BetType
        fields = '__all__'

class BetSerializer(serializers.ModelSerializer):
    match_details = MatchSerializer(source='match', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Bet
        fields = '__all__'
        read_only_fields = ['user', 'potential_win', 'status', 'created_at']

class CreateBetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bet
        fields = ['match', 'bet_type', 'selection', 'odds', 'stake']

    def validate(self, data):
        # Check if match is still active for betting
        if data['match'].status not in ['scheduled', 'live']:
            raise serializers.ValidationError("Match is not available for betting")
        
        # Calculate potential win
        data['potential_win'] = data['stake'] * data['odds']
        
        return data

class BetSlipSerializer(serializers.ModelSerializer):
    bets = BetSerializer(many=True, read_only=True)
    
    class Meta:
        model = BetSlip
        fields = '__all__'
        read_only_fields = ['user', 'created_at']