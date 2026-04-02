from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("rentals", "0003_create_superuser"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="event_location",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="customer",
            name="location",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="customer",
            name="emergency_contact_name",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="customer",
            name="emergency_contact_phone",
            field=models.CharField(blank=True, max_length=30),
        ),
    ]
