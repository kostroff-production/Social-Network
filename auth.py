from django.utils import timezone
from django.contrib.auth.backends import ModelBackend
from .models import Person

# кастомная модель аутоитентификации пользователя
class EmailAuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None):
        # пользователь может войти в систему введя логин или номер телефона
        # проверяем входящие данные логина
        if '@' in username:
            kwargs = {'email': username}
        else:
            kwargs = {'phone': username}

        try:
            # извлекаем модель объекта и сверяем пароль и если данные верны возвращаем пользователя, если нет то ничего не возвращаем
            user = Person.objects.get(**kwargs)
            if user.check_password(password):
                return user
            else:
                return None
        except Person.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            # проверка зарегестрированного пользователя вызываемая по запросу
            # пользователь имеет статус нахождения системы, который мы проверяем
            user = Person.objects.get(pk=user_id)
            user.last_online = timezone.now()  # При запросе пользователя выполним обновлении даты и времени последнего посещения
            user.save(update_fields=['last_online'])
            return user
        except Person.DoesNotExist:
            return None