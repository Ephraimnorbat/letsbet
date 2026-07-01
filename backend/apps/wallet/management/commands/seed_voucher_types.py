from django.core.management.base import BaseCommand
from apps.wallet.models import VoucherType

class Command(BaseCommand):
    help = 'Seed voucher types'

    def handle(self, *args, **options):
        voucher_types = [
            {'name': 'Deposit Voucher', 'code': 'DEP', 'min_amount': 10, 'max_amount': 1000000},
            {'name': 'Withdrawal Voucher', 'code': 'WTH', 'min_amount': 10, 'max_amount': 1000000},
            {'name': 'Bonus Voucher', 'code': 'BON', 'min_amount': 0, 'max_amount': 50000},
            {'name': 'Promotion Voucher', 'code': 'PROMO', 'min_amount': 0, 'max_amount': 20000},
        ]
        
        for vtype in voucher_types:
            obj, created = VoucherType.objects.get_or_create(
                code=vtype['code'],
                defaults={
                    'name': vtype['name'],
                    'min_amount': vtype['min_amount'],
                    'max_amount': vtype['max_amount'],
                    'is_active': True
                }
            )
            self.stdout.write(f"{'Created' if created else 'Found'} voucher type: {obj.name}")
        
        self.stdout.write(self.style.SUCCESS('Voucher types seeded successfully!'))