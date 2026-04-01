from django.db import migrations

def create_superuser(apps, schema_editor):
    User = apps.get_model("rentals", "User")

    existing_user = User.objects.filter(username="admin").first()
    if existing_user:
        existing_user.set_password("Admin12345")
        existing_user.is_superuser = True
        existing_user.is_staff = True
        existing_user.is_active = True
        existing_user.save()
    else:
        user = User.objects.create(
            username="admin",
            email="1manful0@gmail.com",
            is_superuser=True,
            is_staff=True,
            is_active=True,
        )
        user.set_password("Admin12345")
        user.save()

def remove_superuser(apps, schema_editor):
    User = apps.get_model("rentals", "User")
    User.objects.filter(username="admin").delete()

class Migration(migrations.Migration):

    dependencies = [
        ("rentals", "0002_user_is_booking_approver"),
    ]

    operations = [
        migrations.RunPython(create_superuser, remove_superuser),
    ]
