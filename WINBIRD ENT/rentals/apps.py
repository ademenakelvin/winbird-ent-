from django.apps import AppConfig

class RentalsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rentals'

    def ready(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='Louis',
                email='lmanful0@gmail.com',
                password='Agnes22?'
            )
