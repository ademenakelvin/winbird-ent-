from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('rentals', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_booking_approver',
            field=models.BooleanField(default=False),
        ),
    ]
