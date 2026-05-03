from rest_framework import serializers
from django.utils import timezone

from .models import BetType, Bet, BetSlip
from apps.matches.serializers import MatchSerializer
from apps.matches.models import Match, Team, League

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
    match_id = serializers.CharField(write_only=True)
    sport_key = serializers.CharField(write_only=True)
    home_team_name = serializers.CharField(write_only=True)
    away_team_name = serializers.CharField(write_only=True)
    bet_type = serializers.IntegerField(write_only=True)

    class Meta:
        model = Bet
        fields = [
            'match_id', 'sport_key', 'home_team_name', 
            'away_team_name', 'bet_type', 'selection', 'odds', 'stake'
        ]

    def validate(self, data):
        # Access user from context (passed by the view)
        user = self.context['request'].user
        match_id = data.get('match_id')

        # ✅ NEW: Check for existing pending bets on this match for this user
        if Bet.objects.filter(user=user, match__external_id=match_id, status='pending').exists():
            raise serializers.ValidationError(
                f"You already have a pending bet on {data.get('home_team_name')} vs {data.get('away_team_name')}."
            )

        # 1. Resolve BetType
        try:
            data['bet_type'] = BetType.objects.get(id=data['bet_type'])
        except BetType.DoesNotExist:
            raise serializers.ValidationError({"bet_type": "Invalid BetType ID"})

        # 2. Resolve the League
        try:
            league = League.objects.get(external_key=data['sport_key'])
        except League.DoesNotExist:
            raise serializers.ValidationError({"sport_key": f"League '{data.get('sport_key')}' not found."})

        # 3. Get/Create Teams
        home, _ = Team.objects.get_or_create(name=data['home_team_name'], defaults={'league': league})
        away, _ = Team.objects.get_or_create(name=data['away_team_name'], defaults={'league': league})

        # 4. Sync Match
        match_date = self.initial_data.get('commence_time')
        match, _ = Match.objects.get_or_create(
            external_id=match_id,
            defaults={
                'league': league,
                'home_team': home,
                'away_team': away,
                'match_date': match_date if match_date else timezone.now(),
                'status': 'scheduled'
            }
        )

        # 5. Finalize
        data['match'] = match
        data['potential_win'] = float(data['stake']) * float(data['odds'])
        
        # Cleanup helpers
        for field in ['match_id', 'sport_key', 'home_team_name', 'away_team_name']:
            if field in data: data.pop(field)

        return data

class BetSlipSerializer(serializers.ModelSerializer):
    bets = BetSerializer(many=True, read_only=True)
    
    class Meta:
        model = BetSlip
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class BetSelectionSerializer(serializers.ModelSerializer):
    """Serializes individual matches within a slip"""
    match_details = MatchSerializer(source='match', read_only=True)
    
    class Meta:
        model = Bet
        fields = ['id', 'match_details', 'selection', 'odds', 'status']

class BetSlipHistorySerializer(serializers.ModelSerializer):
    """The 'Master Card' serializer"""
    selections = BetSelectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = BetSlip
        fields = [
            'id', 'total_stake', 'total_odds', 
            'potential_win', 'status', 'created_at', 'selections'
        ]