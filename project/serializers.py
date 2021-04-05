from rest_framework import serializers
from .models import Person, Friend, Re_Post, Audio, Photo, Video, Group, Chat, Album, Comment, Post

# для конкретных задач создаем формы сериализации наших моделей, оформление схоже с обычной modelForm
class PersonSerializers(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['slug', 'first_name', 'last_name', 'date_birth', 'marital_status', 'id'] # описываем, что нужно сериализовать для дальнейшего использования полученных данных

class FriendSerializers(serializers.ModelSerializer):
    class Meta:
        model = Friend
        fields = ['pk', 'friends']
        depth = 1 # данный параметр позволяет нам сделать углубление в атрибут модели сериализации, модель друга содержит в себе модель юзера данные которого мы хотим использователя

class RePostSerializers(serializers.ModelSerializer):
    class Meta:
        model = Re_Post
        fields = ['id', 'recipients']

class AudioSerializers(serializers.ModelSerializer):
    class Meta:
        model = Audio
        fields = ['author_track', 'title_track', 'audio', 'id']

class PhotoSerializers(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['photo']

class VideoSerializes(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['poster', 'video', 'id']

class GroupSerializers(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'followers']

class ChatSerializers(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = ['last_message']
        depth = 2 # в данном случае нам нужно углубиться на два уровня, по мимо данных последнего сообщения, мы еще сможем получить данные юзера написавшего его

class PossibleFriendSerializers(serializers.ModelSerializer):
    class Meta:
        model = Friend
        fields = ['id']

class AvatarSerializers(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['photo']
        depth = 1

class CommentSerializers(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['slug', 'id', 'user', 'content', 'date', 'parent']
        depth = 1

class PostSerializers(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['slug', 'id', 'user', 'message', 'date_pub']
        depth = 1