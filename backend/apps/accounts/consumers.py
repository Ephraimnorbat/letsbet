# account/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Currency

class CurrencyRateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'currency_updates'
        
        # Join the currency updates group channel room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        
        # Stream down structural current rates context parameters automatically
        await self.send_initial_rates()
    
    async def disconnect(self, close_code):
        # Leave group room cleanly on consumer disposal
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json.get('message')
            
            if message == 'get_rates':
                await self.send_initial_rates()
        except Exception:
            pass
    
    @database_sync_to_async
    def get_rates_payload(self):
        """Fetch active trading currency fields from the database."""
        currencies = Currency.objects.filter(is_active=True)
        return {
            currency.code: {
                'rate': float(currency.exchange_rate_to_kES),
                'symbol': currency.symbol,
                'name': currency.name
            }
            for currency in currencies
        }
    
    async def send_initial_rates(self):
        rates_data = await self.get_rates_payload()
        await self.send(text_data=json.dumps({
            'type': 'initial_rates',
            'rates': rates_data
        }))
    
    async def currency_update(self, event):
        """
        Invoked automatically via async_to_sync inside celery tasks pipeline.
        Pushes fresh rates downstream to the user's browser.
        """
        await self.send(text_data=json.dumps({
            'type': 'rate_update',
            'currency': event['currency'],
            'rate': event['rate'],
            'symbol': event.get('symbol', '$')
        }))