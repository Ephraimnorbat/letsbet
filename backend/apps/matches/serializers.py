from rest_framework import serializers
from .models import Sport, League, Team, Match, MatchEvent

class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = '__all__'

class LeagueSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    
    class Meta:
        model = League
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)
    
    class Meta:
        model = Team
        fields = '__all__'

class MatchEventSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = MatchEvent
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    events = MatchEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = Match
        fields = '__all__'

class MatchListSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source='home_team.name')
    away_team_name = serializers.CharField(source='away_team.name')
    league_name = serializers.CharField(source='league.name')
    
    class Meta:
        model = Match
        fields = ['id', 'home_team_name', 'away_team_name', 'match_date', 'status',
                 'home_score', 'away_score', 'home_odds', 'draw_odds', 'away_odds',
                 'league_name']

class LiveMatchSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source='home_team.name')
    away_team_name = serializers.CharField(source='away_team.name')
    
    class Meta:
        model = Match
        fields = ['id', 'home_team_name', 'away_team_name', 'home_score', 'away_score',
                 'home_odds', 'draw_odds', 'away_odds', 'match_date', 'home_possession',
                 'away_possession', 'home_shots', 'away_shots']