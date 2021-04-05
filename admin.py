from django.contrib import admin
from .models import (
    Person, Chat, Message, Comment, Post, Friend, Re_Post, Permission, Group,
    LikeDislike, Album, Photo, Audio, Video
)

# регистрицая моделей в админ панели

admin.site.register(Person)
admin.site.register(Chat)
admin.site.register(Message)
admin.site.register(Comment)
admin.site.register(Post)
admin.site.register(Friend)
admin.site.register(Re_Post)
admin.site.register(Permission)
admin.site.register(Group)
admin.site.register(LikeDislike)
admin.site.register(Album)
admin.site.register(Photo)
admin.site.register(Audio)
admin.site.register(Video)
