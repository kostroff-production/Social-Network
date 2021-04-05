from django.db import models
from django.db.models import Q
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from time import time
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings
from django.urls import reverse
from django.db.models import Sum, FileField
from django.forms import forms
from django.template.defaultfilters import filesizeformat
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.humanize.templatetags.humanize import naturaltime
from django.utils.translation import ugettext_lazy as _

# метод генерации слага
def gen_slug(s):
    slug = slugify(s, allow_unicode=True)
    return slug + str(int(time()))

class ChatManager(models.Manager):
    use_for_related_fields = True

    # проверяем сообщения в чате на непрочитанность
    def unread_chat(self, user=None):
        qs = self.get_queryset().exclude(last_message__isnull=True).filter(members__id=user).filter(last_message__is_read=False)
        try:
            return qs.exclude(last_message__author=user)
        except TypeError:
            pass

class Chat(models.Model):
    DIALOG = 'D'
    CHAT = 'C'
    CHAT_TYPE_CHOICES = (
        (DIALOG, 'Диалог'),
        (CHAT, 'Чат')
    )

    slug = models.SlugField(max_length=150, blank=False, unique=True) # в чатах слаг обязательно должен быть уникален
    type = models.CharField(
        max_length=1,
        choices=CHAT_TYPE_CHOICES,
        default=CHAT # так же устанавливаем значение по умолчанию, что в дальнейшей облегчит работу при формировании чата
    )
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, verbose_name='Участник') # модель участников многие для многих, потому что участников явно может быть больше двух и в дальнейшем это ускорит поиск модели чата
    last_message = models.ForeignKey(
        'Message', # так как модель сообщения пока не объявлена указываем ее в строчной варианте
        related_name='last_message',
        on_delete=models.SET_NULL, # удаление должно быть не каскаждым иначе при удалении одного сообщения, оно потянет за собой все которые были в чате и сам чат
        blank=True,
        null=True # атрибут важен так как объект модели может содержать "ничего"
    )

    objects = ChatManager() # дополнительный объект модели с кастомными методами под кокретные задачи

    class Meta:
        ordering = ['-last_message'] # чаты выводим по последнему написано сообщению и в начале новые, потом старые

    # описывает метод сохраниения модели, в котором генерируем уникальный слаг, в дальнейшем данный метод будет применен и к другим моделям
    def save(self, *args, **kwargs):
        if not self.id:
            self.slug = gen_slug(time())
        super().save(*args, **kwargs)

    # так же дополнительно можем вызывать модель с ее содежимым через юрл адрес, в котором хотим отобразить данные модели и продолжить работу с ней
    def get_absolute_url(self):
        return reverse('message_url', kwargs={'chat_id': self.pk})

class Message(models.Model):
    slug_message = models.SlugField(max_length=150, blank=False, unique=True)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, verbose_name='') # в данном случае указываем каскадное удаление, потому что если удалиться чат то и сообщения его нам не нужны
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='') # автор регестрируется исходя из пользователя создавшего сообщение
    message = models.TextField()
    date_pub = models.DateTimeField(auto_now_add=True)
    date_update = models.DateTimeField(auto_now_add=True) # по митмо даты формирования создадим и дату обновления
    is_read = models.BooleanField(default=False, verbose_name='') # добавим проверку на не прочитанность
    is_update = models.BooleanField(default=False, verbose_name='') # и обновление

    def save(self, *args, **kwargs):
        if not self.id:
            self.slug_message = gen_slug(time())
        super().save(*args, **kwargs)

    # для вызова метода обновления модели сообщения указываем модели на какой юрл делать вызов
    def update_message_url(self):
        return reverse('update_message_url')

    class Meta:
        ordering = ['date_pub'] # сортировку производим исходя из даты создания

    def __str__(self):
        return self.message # указываем строчное значение модели, по которому будем определять модели в нашей админ панели например, именем модели будет текст его сообщения

# суб классы мы будем создавать через абстрактную модель, от которой они все будут наследоваться,
# в дальнейшем это упростит задачу по установке связей между моделями, связывать будем через GenericForeignKey
class AbstractModel(models.Model):
    slug = models.SlugField(max_length=150) # здесь уже уникальность слага не так важна и в некоторых случаях может даже усложнить формирование поиска моделей
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE) # устанавливаем тип модели родителя для нашего саб класса
    object_id = models.PositiveIntegerField() # саб модель так же идентифицируется по айди ее родителя(модели, которой она будет принадлежать)
    content_objects = GenericForeignKey('content_type', 'object_id') # связывем ключи для генерации внешнего ключа, который будет принадлежать родителю

    class Meta:
        abstract = True # подтверждаем, что класс абстрактный

class LikeDislikeManager(models.Manager):
    use_for_related_fields = True

    def likes(self):
        return self.get_queryset().filter(vote__gt=0) # считаем лайки

    def dislike(self):
        return self.get_queryset().filter(vote__lt=0) # считаем дизлайки

    def sum_rating(self):
        return  self.get_queryset().aggregate(Sum('vote')).get('vote__sum') or 0 # суммарный рейтинг

class LikeDislike(AbstractModel):
    LIKE = 1
    DISLIKE = 1

    VOTES = (
        (LIKE, 'Нравится'),
        (DISLIKE, 'Не нравится')
    )

    vote = models.SmallIntegerField(verbose_name='Голос', choices=VOTES) # указываем тип голоса
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE) # привязываем модель к голосующему

    objects = LikeDislikeManager()

    def save(self, *args, **kwargs):
        if not self.id:
            self.slug = gen_slug(time())
        super().save(*args, **kwargs)

# указываем место хранения наших файлов
# для сортировки и уникальности под каждого юзера указываем слаги объекта юзера и тип данных, который он сохраняет
def user_directory_path_photo(instance, filename):
    return 'user_{0}/{1}/{2}'.format(instance.user.slug, 'photo', filename)

def user_directory_path_audio(instance, filename):
    return 'user_{0}/{1}/{2}'.format(instance.user.slug, 'audio', filename)

def user_directory_path_video(instance, filename):
    return 'user_{0}/{1}/{2}'.format(instance.user.slug, 'video', filename)

# метод проверки размера файла и типа данных файла
class ContentTypeRestrictedFileField(FileField):
    def __init__(self, *args, **kwargs):
        self.content_types = kwargs.pop('content_types', [])
        self.max_upload_size = kwargs.pop('max_upload_size', [])

        # переписываем базовый метод
        super(ContentTypeRestrictedFileField, self).__init__(*args, **kwargs)

    def clean(self, *args, **kwargs):
        # извлекаем полученные данные привлекая базовый метод
        data = super(ContentTypeRestrictedFileField, self).clean(*args, **kwargs)

        # проверяем входящие данные
        file = data.file
        max_upload = self.max_upload_size # устанавливаем максимально допустимый размер файла, который мы указали ранее в атрибуте модели
        size_file = file.DEFAULT_CHUNK_SIZE # забираем исходный размер для проверки

        try:
            content_type = file.content_type # проверяем тип входящего файла
            if content_type in self.content_types: # сверяем с заданым нами ранее в атрибуте модели
            # в случае не совпадения по типу или размеру выводим сообщение об ошибке в форму модели
                if size_file > max_upload:
                    raise forms.ValidationError(_('Максимально допустимый размер %s. Размер загружаемого файла %s') % (
                        filesizeformat(self.max_upload_size * 10), filesizeformat(size_file * 10)))
            else:
                raise forms.ValidationError(_('Тип файла не поддерживается.'))

        except AttributeError: # если возникнет проблема при проверка данных файла и унего не окажется заданных атрибутов, сбрасывем файл и ничего не делаем
            pass

        return data

class ManagerAlbum(models.Manager):
    use_for_related_fields = True

    def avatar(self):
        return self.get_queryset().filter(descriptionAlbum='Аватар') # метод позволит вытащить аватар для родителя

    def album(self):
        return self.get_queryset() # вытаскиваем все альбомы связанные с родителем

class Album(AbstractModel):
    descriptionAlbum = models.CharField(max_length=150, blank=False)
    photo = models.ForeignKey('Photo', on_delete=models.SET_NULL, null=True, blank=True, related_name='Photo') # устанавливаем SET_NULL, что бы при удалении фото не затрагивалась модель альбома
    date_pub = models.DateField(auto_now_add=True)

    objects = ManagerAlbum()

    def get_absolute_url(self):
        return reverse('person_album_detail_url', kwargs={'slug': self.slug, 'id': self.id})

    def get_absolute_group_url(self):
        return reverse('group_album_detail_url', kwargs={'slug': self.slug, 'id': self.id})

    def __str__(self):
        return self.descriptionAlbum

class Photo(AbstractModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=False, null=False)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, blank=True, null=True, related_name='Album')
    descriptionPhoto = models.TextField(blank=True, null=True)
    date_pub = models.DateTimeField(auto_now_add=True)
    photo = models.ImageField(upload_to=user_directory_path_photo)
    # суб модели так же могут являться родителями для других суб моделей
    # привязываем интересующие нас субы
    re_posts = GenericRelation('Re_Post', related_query_name='re_post_Photo')
    comments = GenericRelation('Comment', related_query_name='Photo_comment')
    votes = GenericRelation(LikeDislike, related_query_name='Photo_LikeDislike')

    TEMPLATE_PREVIEW = 'project/photo_preview.html' # темплейт, который привязан к конктной модели, на который мы можем сослаться через модели и который в дальтнейшем облегчит работу при рендиренге

    def get_absolute_url(self):
        return reverse('photo_comment_url', kwargs={'id': self.id})

class AudioManager(models.Manager):
    use_for_related_fields = True

    # методы поиска моделей, поиск базовый, бональный, ищет по полному совпадению

    def search(self, object_id=None, query=None): # укажем атрибуты для фильтрации
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(author_track=query) | Q(title_track=query))
            qs = qs.filter(object_id=object_id).filter(or_lookup)

        return qs

    def searchGlobal(self, query=None):
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(author_track=query) | Q(title_track=query))
            qs = qs.filter(or_lookup)

        return qs

class Audio(AbstractModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=False, null=False)
    date_pub = models.DateTimeField(auto_now_add=True)
    author_track = models.CharField(max_length=200, blank=True)
    title_track = models.CharField(max_length=200, blank=True)
    audio = ContentTypeRestrictedFileField( # наш ранее созданный кастомный метод проверки и сохранения файлов
        upload_to=user_directory_path_audio, # путь сохранения
        content_types=['audio/mpeg'], # тип данных, который мы хоти видеть
        max_upload_size=52428800, # максимальный размер указанный в байтах
        blank=True,
        null=True
    )

    TEMPLATE_PREVIEW = 'project/audio_preview.html' # темплейт для модели

    objects = AudioManager()

    def get_absolute_url(self):
        return reverse('person_audio_url', kwargs={'slug': self.slug})

# формирование модели аналогично с предыдущей
class VideoManager(models.Manager):
    use_for_related_fields = True

    def search(self, object_id=None, query=None):
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(title_video=query) | Q(description_video=query))
            qs = qs.filter(object_id=object_id).filter(or_lookup)

        return qs

class Video(AbstractModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=False, null=False)
    date_pub = models.DateTimeField(auto_now_add=True)
    title_video = models.CharField(blank=True, max_length=250)
    description_video = models.TextField(blank=True)
    poster = models.ImageField(upload_to=user_directory_path_video, blank=True, null=True)
    video = ContentTypeRestrictedFileField(
        upload_to=user_directory_path_video,
        content_types=['video/x-msvideo', 'video/mp4', 'video/mpeg', 'video/mov', 'video/wmv', 'video/webm'],
        max_upload_size=429916160,
        blank=True,
        null=True
    )
    re_posts = GenericRelation('Re_Post', related_query_name='re_post_Video')
    comments = GenericRelation('Comment', related_query_name='Video_comment')
    votes = GenericRelation(LikeDislike, related_query_name='Video_LikeDislike')

    TEMPLATE_PREVIEW = 'project/video_preview.html'

    objects = VideoManager()

    def get_absolute_url(self):
        return reverse('video_comment_url', kwargs={'id': self.id})

# так как модели можно репостить, создадим модель, которая будет хранить данные о репосте моделей
class Re_Post(AbstractModel):
    re_posts = models.BooleanField(default=False)
    recipients = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Recipients_content') # значение создадим многие ко многим, что бы не плодить саму модель репоста и облегчить вывод пользователей, которые сделали репост

    # здесь можем сделать слаг уникальным, хотя и не принципиально
    def save(self, *args, **kwargs):
        if not self.id:
            self.slug = gen_slug(time())
        super().save(*args, **kwargs)


class CommentManager(models.Manager):
    # фильтруем родительские комментарии
    def filter_by_instance(self, instance):
        content_type = ContentType.objects.get_for_model(instance.__class__) # забираем тип данных модели к которой принадлежат комменты
        object_id = instance.id # ее айди
        qs = super(CommentManager, self).filter(content_type=content_type, object_id=object_id).filter(parent=None) # производим фильтрацию основываясь на данных модели коммента и отсеиваем коменты с родителями
        return qs


class Comment(AbstractModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(blank=True, null=True) # по мимо даты формирования установим и дату обновления
    is_update = models.BooleanField(default=False) # установим булевое значения для сверки на обновление
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True) # указываем self, потому что родителем и будет являться сама модель коммента

    objects = CommentManager()

    class Meta(AbstractModel.Meta):
        db_table = 'comments'
        ordering = ['date'] # выводим по дате создания

    def __str__(self):
        return "%s: %s..." % (self.user, self.content[:50])

    def children(self):
        return Comment.objects.filter(parent=self)


class Post(AbstractModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=False, null=False)
    message = models.TextField()
    date_pub = models.DateTimeField(auto_now_add=True)
    # привязываем наши суб модели
    re_posts = GenericRelation(Re_Post, related_query_name='re_post_Post')
    comments = GenericRelation(Comment, related_query_name='Post_comment')
    votes = GenericRelation(LikeDislike, related_query_name='Post_LikeDislike')

    TEMPLATE_PREVIEW = 'project/post_preview.html' # так же создаем тимплейт для модели

    class Meta(AbstractModel.Meta):
        db_table = 'Posts'
        ordering = ['-date_pub'] # выводим сначала новые, потом старые

    def save(self, *args, **kwargs):
        if not self.id:
            self.slug = gen_slug(time())
        return super().save(*args, **kwargs)

    def __str__(self):
        return "%s: %s..." % (self.user, self.date_pub)

    def get_absolute_url(self):
        return reverse('post_comment_url', kwargs={'id': self.id})


class FriendManager(models.Manager):
    use_for_related_fields = True

    def search(self, object_id=None, query=None):
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(friends__first_name=query) | Q(friends__last_name=query) | Q(friends__middle_name=query))
            qs = qs.filter(object_id=object_id).filter(or_lookup)

        return qs

class Friend(AbstractModel):
    # модель друга имеет по мимо основного атирибута друг еще и "возможный друг", и "ожидает дружбы"
    # потому что подтверждение дружбы происходит двухсторонее и данные атрибуты служат для создания предварительных моделей дружбы между пользователями
    friends = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='Друзья', blank=True, null=True, on_delete=models.CASCADE)
    possible_friends = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='Возможные_друзья', blank=True, null=True, on_delete=models.CASCADE)
    waiting_confirmations = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='Ожидание_подтвержденя', blank=True, null=True, on_delete=models.CASCADE)

    objects = FriendManager()

    def create_friend_url(self):
        return reverse('create_friend_url')

# модель приватности страницы пользователя
class Permission(models.Model):
    # модель привязывает к одному пользователю и в дальнейшем только обновляется, не плодя копии
    slug = models.SlugField(max_length=150, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=False, null=False)

    # текстовые атрибуты будут нужны для сверки значений приватности
    # возможно как полное скрытие страницы так и отдельного контента на странице
    # так же реализовано сокрытие от некоторых друзей
    # так как модель не плодится то атрибуты модели хранящие юзеров, имеют значение многие ко многим
    all = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_от_всех', blank=True)
    txtAll = models.TextField(blank=True, verbose_name='описание_профиля')

    audio = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_аудио', blank=True)
    txtAudio = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_аудио')
    audioHidFriend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_аудио_от_некоторых_друзей', blank=True)
    txtHidAudio = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_аудио_от_некоторых_друзей')

    video = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_видео', blank=True)
    txtVideo = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_видео')
    videoHidFriend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_видео_от_некоторых_друзей', blank=True)
    txtHidVideo = models.TextField(verbose_name='статус_приватности_для_модели_видео_от_некоторых_друзей', blank=True)

    photo = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_фото', blank=True)
    txtPhoto = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_фото')
    photoHidFriend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_фото_от_некоторых_друзей', blank=True)
    txtHidPhoto = models.TextField(verbose_name='статус_приватности_для_модели_фото_от_некоторых_друзей', blank=True)

    group = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_группы', blank=True)
    txtGroup = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_группа')
    groupHidFriend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_группы_от_некоторых_друзей', blank=True)
    txtHidGroup = models.TextField(verbose_name='статус_приватности_для_модели_группа_от_некоторых_друзей', blank=True)

    post = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_посты', blank=True)
    txtPost = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_пост')
    postHidFriend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_посты_от_некоторых_друзей', blank=True)
    txtHidPost = models.TextField(verbose_name='статус_приватности_для_модели_пост_от_некоторых_друзей', blank=True)

    friend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_друзей', blank=True)
    txtFriend = models.TextField(blank=True, verbose_name='статус_приватности_для_модели_друзей')
    friendHidFriend = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Скрыть_друзей_от_некоторых_друзей', blank=True)
    txtHidFriend = models.TextField(verbose_name='статус_приватности_для_модели_друзей_от_некоторых_друзей', blank=True)

    def get_create_permission(self):
        return reverse('create_permission_url')

    def get_update_permission(self):
        return reverse('update_permission_url', kwargs={'slug': self.slug})

    def __str__(self):
        return "%s %s" % (self.user.first_name, self.user.last_name)

class GroupManager(models.Manager):
    use_for_related_fields = True

    def searchFollowers(self, followers=None, query=None):
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(name=query))
            qs = qs.filter(followers=followers).filter(or_lookup)
        return qs

    def searchUser(selfself, user=None, query=None):
        qs = selfself.get_queryset()
        if query:
            or_lookup = (Q(name=query))
            qs = qs.filter(user=user).filter(or_lookup)
        return qs

    def searchGroupAll(self, query=None):
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(name=query))
            qs = qs.filter(or_lookup)
        return qs

class Group(models.Model):
    slug = models.SlugField(max_length=150, blank=False, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=False, on_delete=models.CASCADE) # привязываем админа группы
    followers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='Подписчики', blank=True) # подписчики привязываются в одностороннем порядке, для удобства используем модель многие ко многим
    name = models.TextField(max_length=50, blank=False)
    description = models.TextField(max_length=2000, blank=True)
    quote = models.TextField(max_length=250, blank=True)

    # подключаем суб классы
    posts = GenericRelation(Post, related_query_name='Посты')
    album = GenericRelation(Album, related_query_name='Аватар')
    photo = GenericRelation(Photo, related_query_name='Фото')
    audio = GenericRelation(Audio, related_query_name='Аудио')
    video = GenericRelation(Video, related_query_name='Видео')

    objects = GroupManager()

    def get_absolute_url(self):
        return reverse('group_detail_url', kwargs={'slug': self.slug})

    def get_settings_url(self):
        return reverse('group_settings_url', kwargs={'slug': self.slug})

    def get_photos_url(self):
        return reverse('group_photo_url', kwargs={'slug': self.slug})

    def get_audios_url(self):
        return reverse('group_audio_url', kwargs={'slug': self.slug})

    def get_videos_url(self):
        return reverse('group_video_url', kwargs={'slug': self.slug})

    def save(self, *args, **kwargs):
        if not self.id:
            self.slug = gen_slug(time())
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# модель юзера сделана кастомной для более гибкого ее использования
# создаем кастомную модель которая будет наследоваться от базовой модели юзер менеджера, в которой мы изменим методы создания пользователя
# и общего менеджера модели, что позволит применять наш метод как меноджер для модели юзера
class CustomAccountManager(BaseUserManager, models.Manager):
    use_for_related_fields = True

    # переписываем процесс создания обычного пользователя
    def create_user(self, email, password): # в качестве логина по умолчанию принимаем емаил
        user = self.model(email=email, password=password)
        user.set_password(password)
        user.is_active = True
        user.is_staff = False
        user.is_superuser = False
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password): # аналогично меняем логин и для суперпользователя
        user = self.model(email=email, password=password)
        user.set_password(password)
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

    def get_by_natural_key(self, username): # указываем что имя юзера нужно сверять по емайлу
        return self.get(email=username)

    # так как это менеджер модели то добавим, по мимо методов создания пользователя, поисковик для решения конкретных задач
    def search(self, query=None):
        qs = self.get_queryset()
        if query:
            or_lookup = (Q(last_name=query) | Q(first_name=query) | Q(middle_name=query))
            qs = qs.filter(or_lookup)
        return qs

class Person(AbstractBaseUser, PermissionsMixin):
    man = 'Мужской'
    woman = 'Женский'

    CHOICE_GENDER = (
        (man, 'Мужской'),
        (woman, 'Женский')
    )

    man_not_married = 'Не женат'
    man_married = 'Женат'
    woman_not_married = 'Не замужем'
    woman_married = 'Замужем'
    man_in_love = 'Влюблен'
    woman_in_love = 'Влюблена'
    active_search = 'В активном поиске'

    CHOICE_MARITAL_STATUS = (
        (man_not_married, 'Не женат'),
        (man_married, 'Женат'),
        (woman_not_married, 'Не замужем'),
        (woman_married, 'Замужем'),
        (man_in_love, 'Влюблен'),
        (woman_in_love, 'Влюблена'),
        (active_search, 'В активном поиске')
    )

    # так как модель кастомная мы можем указать все, что хотим видеть у нашей модели юзера
    quote = models.CharField(max_length=150, blank=True)
    slug = models.SlugField(max_length=150, unique=True)
    phone = models.CharField(unique=True, max_length=11)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    date_birth = models.DateField(null=True)
    gender = models.CharField(choices=CHOICE_GENDER, max_length=7)
    marital_status = models.CharField(choices=CHOICE_MARITAL_STATUS, max_length=20)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    last_online = models.DateTimeField(blank=True, null=True)

    # так же подключим суб классы
    posts = GenericRelation(Post, related_query_name='Посты')
    friends = GenericRelation(Friend, related_query_name='Друзья')
    album = GenericRelation(Album, related_query_name='Аватар')
    photo = GenericRelation(Photo, related_query_name='Фото')
    audio = GenericRelation(Audio, related_query_name='Аудио')
    video = GenericRelation(Video, related_query_name='Видео')

    REQUIRED_FIELDS = []
    USERNAME_FIELD = 'email' # указываем что логином будет емаил, который будет проверяться в переписаном менеджере

    objects = CustomAccountManager()

    def save(self, *args, **kwargs):
        if not self.id:
            self.slug = gen_slug(int(time()))
        super().save(*args, **kwargs)

    def get_short_name(self):
        return self.email

    def natural_key(self):
        return self.email

    def get_absolute_url(self):
        return reverse('person_url', kwargs={'slug': self.slug})

    def get_chat_url(self):
        return reverse('chat_url')

    def get_friends_url(self):
        return reverse('person_friends_url', kwargs={'slug': self.slug})

    def get_photos_url(self):
        return reverse('person_photos_url', kwargs={'slug': self.slug})

    def get_audios_url(self):
        return reverse('person_audio_url', kwargs={'slug': self.slug})

    def get_videos_url(self):
        return reverse('person_video_url', kwargs={'slug': self.slug})

    def get_message_url(self):
        return reverse('message_user_url', kwargs={'pk': self.pk})

    def get_group_url(self):
        return reverse('list_groups_url', kwargs={'slug': self.slug})

    # В данном методе проверяем, что дата последнего посещения не старше 5 минут
    def is_online(self):
        if self.last_online:
            return (timezone.now() - self.last_online) < timezone.timedelta(minutes=5)
        return False

    # Если пользователь посещал сайт не более 5 минут назад,
    def get_online_info(self):
        if self.is_online():
            # то возвращаем информацию, что он онлайн
            return 'Online'
        if self.last_online:
            # иначе пишем сообщение о последнем посещении и переводим ее
            return _('Last visit {}').format(naturaltime(self.last_online))
            # так как мы добавили информацию о посещении пользователем сайта не сразу
            # то для некоторых пользователей инфомации о посещении может и не быть, вернём информацию, что последнее посещение неизвестно
        return 'Неизвестно'

    def __str__(self):
        return "%s %s" % (self.first_name, self.last_name)
