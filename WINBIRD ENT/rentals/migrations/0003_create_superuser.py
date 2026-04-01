from django.db import migrations

def create_superuser(apps, schema_editor):
    User = apps.get_model('rentals', 'User')

    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='1manful0@gmail.com',
            password='Admin12345'
        )

def remove_superuser(apps, schema_editor):
    User = apps.get_model('rentals', 'User')
    User.objects.filter(username='admin').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('rentals', '0002_user_is_booking_approver'),
    ]

    operations = [
        migrations.RunPython(create_superuser, remove_superuser),
    ]
