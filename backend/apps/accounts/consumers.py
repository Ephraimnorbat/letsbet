import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Currency

class CurrencyRateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'currency_updates'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial rates
        await self.send_initial_rates()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')
        
        # Handle client messages if needed
        if message == 'get_rates':
            await self.send_initial_rates()
    
    @database_sync_to_async
    def get_rates(self):
        currencies = Currency.objects.filter(is_active=True)
        return {
            currency.code: float(currency.exchange_rate_to_kES)
            for currency in currencies
        }
    
    async def send_initial_rates(self):
        rates = await self.get_rates()
        await self.send(text_data=json.dumps({
            'type': 'initial_rates',
            'rates': rates
        }))
    
    async def currency_update(self, event):
        """Send currency updates to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'rate_update',
            'currency': event['currency'],
            'rate': event['rate']
        }))