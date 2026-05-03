import requests
from django.conf import settings

class NowPaymentsService:
    @staticmethod
    def create_payment(amount, order_id, pay_currency="usdttrc20"):
        # Use the URL from settings (ensure it's the PROD one now)
        url = f"{settings.NOWPAYMENTS_BASE_URL.rstrip('/')}/payment"
        
        headers = {
            "x-api-key": settings.NOWPAYMENTS_API_KEY,
            "Content-Type": "application/json",
        }

        payload = {
            "price_amount": float(amount),
            "price_currency": "usd",
            "pay_currency": pay_currency.lower(),
            "order_id": order_id,
            "ipn_callback_url": settings.NOWPAYMENTS_IPN_URL,
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code >= 400:
            print(f"DEBUG PROD ERROR: {response.status_code} - {response.text}")
            
        response.raise_for_status()
        return response.json()