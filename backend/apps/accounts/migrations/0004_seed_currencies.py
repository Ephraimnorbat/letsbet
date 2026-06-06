
# Generated automatically.

from django.db import migrations

def seed_currencies(apps, schema_editor):
    # Dynamically grab the model from the historical state
    Currency = apps.get_model('accounts', 'Currency') 

    currency_data = [
        {"code": "AOA", "name": "Angolan Kwanza", "symbol": "Kz", "exchange_rate_to_kES": "0.1500"},
        {"code": "UGX", "name": "Ugandan Shilling", "symbol": "USh", "exchange_rate_to_kES": "0.0340"},
        {"code": "TZS", "name": "Tanzanian Shilling", "symbol": "TSh", "exchange_rate_to_kES": "0.0500"},
        {"code": "NGN", "name": "Nigerian Naira", "symbol": "₦", "exchange_rate_to_kES": "0.0910"},
        {"code": "ZAR", "name": "South African Rand", "symbol": "R", "exchange_rate_to_kES": "7.1000"},
        {"code": "USD", "name": "United States Dollar", "symbol": "$", "exchange_rate_to_kES": "130.0000"},
        {"code": "GBP", "name": "British Pound", "symbol": "£", "exchange_rate_to_kES": "165.0000"},
        {"code": "EUR", "name": "Euro", "symbol": "€", "exchange_rate_to_kES": "140.0000"},
        {"code": "DZD", "name": "Algerian Dinar", "symbol": "DA", "exchange_rate_to_kES": "0.9700"},
        {"code": "ARS", "name": "Argentine Peso", "symbol": "$", "exchange_rate_to_kES": "0.1500"},
        {"code": "BDT", "name": "Bangladeshi Taka", "symbol": "৳", "exchange_rate_to_kES": "1.1100"},
        {"code": "BOB", "name": "Bolivian Boliviano", "symbol": "Bs", "exchange_rate_to_kES": "18.8200"},
        {"code": "BWP", "name": "Botswana Pula", "symbol": "P", "exchange_rate_to_kES": "9.5200"},
        {"code": "BRL", "name": "Brazilian Real", "symbol": "R$", "exchange_rate_to_kES": "25.2000"},
        {"code": "BIF", "name": "Burundian Franc", "symbol": "FBu", "exchange_rate_to_kES": "0.0450"},
        {"code": "XAF", "name": "Central African CFA Franc", "symbol": "Fr", "exchange_rate_to_kES": "0.2100"}, # Shortened
        {"code": "CAD", "name": "Canadian Dollar", "symbol": "C$", "exchange_rate_to_kES": "95.5000"},
        {"code": "CLP", "name": "Chilean Peso", "symbol": "$", "exchange_rate_to_kES": "0.1400"},
        {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥", "exchange_rate_to_kES": "18.0000"},
        {"code": "COP", "name": "Colombian Peso", "symbol": "$", "exchange_rate_to_kES": "0.0330"},
        {"code": "CZK", "name": "Czech Koruna", "symbol": "Kč", "exchange_rate_to_kES": "5.6000"},
        {"code": "DKK", "name": "Danish Krone", "symbol": "kr", "exchange_rate_to_kES": "18.7500"},
        {"code": "EGP", "name": "Egyptian Pound", "symbol": "E£", "exchange_rate_to_kES": "2.7300"},
        {"code": "ETB", "name": "Ethiopian Birr", "symbol": "Br", "exchange_rate_to_kES": "1.1500"},
        {"code": "GHS", "name": "Ghanaian Cedi", "symbol": "GH₵", "exchange_rate_to_kES": "9.2000"},
        {"code": "HUF", "name": "Hungarian Forint", "symbol": "Ft", "exchange_rate_to_kES": "0.3600"},
        {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "exchange_rate_to_kES": "1.5600"},
        {"code": "IDR", "name": "Indonesian Rupiah", "symbol": "Rp", "exchange_rate_to_kES": "0.0081"},
        {"code": "ILS", "name": "Israeli New Shekel", "symbol": "₪", "exchange_rate_to_kES": "35.4000"},
        {"code": "XOF", "name": "West African CFA Franc", "symbol": "Fr", "exchange_rate_to_kES": "0.2100"}, # Shortened
        {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "exchange_rate_to_kES": "0.8300"},
        {"code": "KWD", "name": "Kuwaiti Dinar", "symbol": "KD", "exchange_rate_to_kES": "422.0000"},
        {"code": "LRD", "name": "Liberian Dollar", "symbol": "$", "exchange_rate_to_kES": "0.6800"},
        {"code": "LYD", "name": "Libyan Dinar", "symbol": "LD", "exchange_rate_to_kES": "27.0000"},
        {"code": "MGA", "name": "Malagasy Ariary", "symbol": "Ar", "exchange_rate_to_kES": "0.0290"},
        {"code": "MWK", "name": "Malawian Kwacha", "symbol": "MK", "exchange_rate_to_kES": "0.0750"},
        {"code": "MYR", "name": "Malaysian Ringgit", "symbol": "RM", "exchange_rate_to_kES": "27.6000"},
        {"code": "MXN", "name": "Mexican Peso", "symbol": "$", "exchange_rate_to_kES": "7.6500"},
        {"code": "MAD", "name": "Moroccan Dirham", "symbol": "DH", "exchange_rate_to_kES": "12.9000"},
        {"code": "MZN", "name": "Mozambican Metical", "symbol": "MT", "exchange_rate_to_kES": "2.0300"},
        {"code": "NAD", "name": "Namibian Dollar", "symbol": "N$", "exchange_rate_to_kES": "7.1000"},
        {"code": "NPR", "name": "Nepalese Rupee", "symbol": "रू", "exchange_rate_to_kES": "0.9800"},
        {"code": "NL", "name": "Netherlands Guilder", "symbol": "€", "exchange_rate_to_kES": "140.0000"},
        {"code": "NOK", "name": "Norwegian Krone", "symbol": "kr", "exchange_rate_to_kES": "12.1000"},
        {"code": "PKR", "name": "Pakistani Rupee", "symbol": "₨", "exchange_rate_to_kES": "0.4700"},
        {"code": "PYG", "name": "Paraguayan Guaraní", "symbol": "₲", "exchange_rate_to_kES": "0.0170"},
        {"code": "PEN", "name": "Peruvian Sol", "symbol": "S/.", "exchange_rate_to_kES": "35.1000"},
        {"code": "PH", "name": "Philippine Peso", "symbol": "₱", "exchange_rate_to_kES": "2.3100"},
        {"code": "PLN", "name": "Polish Złoty", "symbol": "zł", "exchange_rate_to_kES": "32.4000"},
        {"code": "QAR", "name": "Qatari Riyal", "symbol": "QR", "exchange_rate_to_kES": "35.7000"},
        {"code": "RON", "name": "Romanian Leu", "symbol": "lei", "exchange_rate_to_kES": "28.2000"},
        {"code": "RWw", "name": "Rwandan Franc", "symbol": "RF", "exchange_rate_to_kES": "0.1000"}, # Shortened
        {"code": "SA", "name": "Saudi Riyal", "symbol": "SR", "exchange_rate_to_kES": "34.6000"},
        {"code": "SLL", "name": "Sierra Leonean Leone", "symbol": "Le", "exchange_rate_to_kES": "0.0057"},
        {"code": "SGD", "name": "Singapore Dollar", "symbol": "S$", "exchange_rate_to_kES": "96.4000"},
        {"code": "SOS", "name": "Somali Shilling", "symbol": "Sh", "exchange_rate_to_kES": "0.2300"}, # Shortened
        {"code": "KRW", "name": "South Korean Won", "symbol": "₩", "exchange_rate_to_kES": "0.0960"},
        {"code": "SSP", "name": "South Sudanese Pound", "symbol": "SS£", "exchange_rate_to_kES": "0.1000"},
        {"code": "LKR", "name": "Sri Lankan Rupee", "symbol": "Rs", "exchange_rate_to_kES": "0.4300"},
        {"code": "SDG", "name": "Sudanese Pound", "symbol": "SDG", "exchange_rate_to_kES": "0.2200"},
        {"code": "SEK", "name": "Swedish Krona", "symbol": "kr", "exchange_rate_to_kES": "12.3000"},
        {"code": "CHF", "name": "Swiss Franc", "symbol": "CHF", "exchange_rate_to_kES": "143.5000"},
        {"code": "THB", "name": "Thai Baht", "symbol": "฿", "exchange_rate_to_kES": "3.5500"},
        {"code": "TND", "name": "Tunisian Dinar", "symbol": "DT", "exchange_rate_to_kES": "41.5000"},
        {"code": "TRY", "name": "Turkish Lira", "symbol": "₺", "exchange_rate_to_kES": "4.0500"},
        {"code": "AED", "name": "UAE Dirham", "symbol": "د.إ", "exchange_rate_to_kES": "35.4000"},
        {"code": "UYU", "name": "Uruguayan Peso", "symbol": "$U", "exchange_rate_to_kES": "3.3500"},
        {"code": "VND", "name": "Vietnamese Đồng", "symbol": "₫", "exchange_rate_to_kES": "0.0051"},
        {"code": "ZMW", "name": "Zambian Kwacha", "symbol": "ZK", "exchange_rate_to_kES": "5.1000"},
        {"code": "ZWL", "name": "Zimbabwean Dollar", "symbol": "Z$", "exchange_rate_to_kES": "0.3600"}
    ]

    for item in currency_data:
        Currency.objects.get_or_create(
            code=item["code"],
            defaults={
                "name": item["name"],
                "symbol": item["symbol"],
                "exchange_rate_to_kES": item["exchange_rate_to_kES"]
            }
        )

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_user_is_active'), # Ensure this matches your actual preceding file name
    ]

    operations = [
        migrations.RunPython(seed_currencies),
    ]