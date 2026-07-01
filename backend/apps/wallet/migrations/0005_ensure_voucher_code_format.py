from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0004_set_wallet_currency_from_user'),
    ]

    operations = [
        # Just ensure the field is correct
        migrations.AlterField(
            model_name='voucher',
            name='code',
            field=models.CharField(max_length=19, unique=True),
        ),
    ]