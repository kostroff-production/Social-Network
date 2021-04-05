from django import forms
from .models import (
    Person, Chat, Message, Comment, Audio, Video, Photo, Group, Friend, Album
)

# формируем форму моделей, на некоторые модели может быть несколько форм, если этого требует ситуация

class PersonForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = ['email', 'phone', 'password', 'first_name', 'last_name', 'middle_name', 'date_birth', 'gender']

        error_messages = {
            'email': {
                'required': 'Обязательное поле'
            },
            'password': {
                'required': 'Обязательное поле'
            },
            'first_name': {
                'required': 'Обязательное поле'
            },
            'last_name': {
                'required': 'Обязательное поле'
            },
            'middle_name': {
                'required': ''
            },
            'date_birth': {
                'required': 'Обязательное поле'
            },
            'gender': {
                'required': 'Обязательное поле'
            }
        }

        widgets = {
            'email': forms.TextInput(attrs={'placeholder': 'Email', 'class': 'form_input'}),
            'phone': forms.TextInput(attrs={'placeholder': 'Телефон', 'class': 'form_input'}),
            'password': forms.TextInput(attrs={'placeholder': 'Password', 'class': 'form_input'}),
            'first_name': forms.TextInput(attrs={'placeholder': 'Имя', 'class': 'form_input'}),
            'last_name': forms.TextInput(attrs={'placeholder': 'Фамилия', 'class': 'form_input'}),
            'middle_name': forms.TextInput(attrs={'placeholder': 'Отчество', 'class': 'form_input'}),
            'date_birth': forms.SelectDateWidget(years=[i for i in range(1930, 2022)], attrs={'class': 'form-control'}),
            'gender': forms.Select(attrs={'class': 'form-gender'})
        }

class PersonSettingsForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = '__all__'
        exclude = ['password', 'is_staff', 'is_active', 'is_superuser', 'slug', 'groups', 'last_login', 'user_permissions', 'last_online']

        labels = {
            'email': 'Email',
            'phone': 'Телефон',
            'first_name': 'Имя',
            'last_name': 'Фамилия',
            'middle_name': 'Отчество',
            'date_birth': 'Дата рождения',
            'gender': 'Пол',
            'quote': 'Цитата',
            'country': 'Страна',
            'city': 'Город',
            'marital_status': 'Семейное положение'
        }

        widgets = {
            'quote': forms.TextInput(attrs={'placeholder': 'Цитата', 'class': 'form_input'}),
            'email': forms.TextInput(attrs={'placeholder': 'Email', 'class': 'form_input'}),
            'phone': forms.TextInput(attrs={'placeholder': 'Телефон', 'class': 'form_input'}),
            'first_name': forms.TextInput(attrs={'placeholder': 'Имя', 'class': 'form_input'}),
            'last_name': forms.TextInput(attrs={'placeholder': 'Фамилия', 'class': 'form_input'}),
            'middle_name': forms.TextInput(attrs={'placeholder': 'Отчество', 'class': 'form_input'}),
            'country': forms.TextInput(attrs={'placeholder': 'Страна', 'class': 'form_input'}),
            'city': forms.TextInput(attrs={'placeholder': 'Город', 'class': 'form_input'}),
            'date_birth': forms.SelectDateWidget(years=[i for i in range(1930, 2022)], attrs={'class': 'form-select'}),
            'gender': forms.Select(attrs={'class': 'form-select'}),
            'marital_status': forms.Select(attrs={'class': 'form-select'})
        }

class FriendsForm(forms.ModelForm):
    class Meta:
        model = Friend
        fields = ['possible_friends', 'waiting_confirmations']

        widgets = {
            'possible_friends': forms.Select(),
            'waiting_confirmations': forms.Select()
        }

class ChatForm(forms.ModelForm):
    class Meta:
        model = Chat
        fields = ['members']

        widgets = {
            'members': forms.CheckboxSelectMultiple(attrs={'class': 'check'})
        }

class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['message']

        labels = {
            'message': ''
        }

        widgets = {
            'message': forms.TextInput(attrs={'class': 'form-control'})
        }

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        labels = {
            'content': '',
        }
        widgets = {
                    'content': forms.TextInput(attrs={'placeholder': 'Введите сообщение'}),
                }
        error_messages = {
            'content': {
                'required': "Информация об ошибке",
            },
        }

class AlbumForm(forms.ModelForm):
    class Meta:
        model = Album
        fields = ['descriptionAlbum']

        widgets = {
            'descriptionAlbum': forms.TextInput()
        }

class PhotoForm(forms.ModelForm):
    class Meta:
        model = Photo
        fields = ['album', 'descriptionPhoto', 'photo']

        labels = {
            'album': '',
            'descriptionPhoto': '',
            'photo': ''
        }

        widgets = {
            'album': forms.Select(attrs={'class': 'select-css'}),
            'descriptionPhoto': forms.TextInput(attrs={'placeholder': 'Придумайте описание к фото....'}),
            'photo': forms.ClearableFileInput()
        }

class AvatarForm(forms.ModelForm):
    class Meta:
        model = Photo
        fields = ['photo']

        labels = {
            'photo': ''
        }

        widgets = {
            'photo': forms.ClearableFileInput()
        }

class AudioForm(forms.ModelForm):
    class Meta:
        model = Audio
        fields = ['author_track', 'title_track', 'audio']

        labels = {
            'author_track': '',
            'title_track': '',
            'audio': ''
        }

        widgets = {
            'author_track': forms.TextInput(),
            'title_track': forms.TextInput(),
            'audio': forms.ClearableFileInput()
        }

class VideoForm(forms.ModelForm):
    class Meta:
        model = Video
        fields = ['title_video', 'description_video', 'poster', 'video']

        labels = {
            'description_video': '',
            'video': 'Загрузите видео файл',
            'poster': 'Загрузите постер для видео',
            'title_video': ''
        }

        widgets = {
            'title_video': forms.TextInput(),
            'description_video': forms.Textarea(),
            'poster': forms.ClearableFileInput(),
            'video': forms.ClearableFileInput()
        }


class GroupForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ['name', 'description']

        labels = {
            'name': '',
            'description': ''
        }

        widgets = {
            'name': forms.TextInput(attrs={'class': 'form_input', 'placeholder': 'Придумайте название...'}),
            'description': forms.Textarea()
        }

class GroupSettingsForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = '__all__'
        exclude = ['slug', 'user', 'followers']

        labels = {
            'name': 'Название',
            'description': 'Описание',
            'quote': 'Текущий статус'
        }

        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Имя', 'class': 'form_input'}),
            'description': forms.TextInput(attrs={'placeholder': 'Опишите, чем является ваша группа...с', 'class': 'form_input'}),
            'quote': forms.TextInput(attrs={'placeholder': 'Текущий статус..', 'class': 'form_input'}),
        }

