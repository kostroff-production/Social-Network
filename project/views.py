from django.views.generic.base import View
from django.shortcuts import render, redirect, get_object_or_404, HttpResponse
from django.views.generic.edit import FormView
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib.contenttypes.models import ContentType
from .models import (
    Person, Chat, Message, Photo, Audio, Video, Comment, Friend, Post, Re_Post,
    Permission, Album, Group, LikeDislike
)
from .form import (
    PersonForm, MessageForm, PhotoForm, AudioForm, VideoForm,
    CommentForm, GroupForm, FriendsForm, AlbumForm, AvatarForm, PersonSettingsForm, GroupSettingsForm
)
from .utils import (
    CustomRegisterUser, ObjectPersonMixin, ObjectDialogMixin, ObjectMessageMixin, ObjectCreateMessageMixin,
    ObjectUpdateMessageMixin, ObjectDeleteMessageMixin, ObjectPostMixin, ObjectCommentMixin,
    ObjectLikeDislikeMixin, ObjectUpdateCommentMixin, ObjectGenericDeleteMixin,
    ObjectCreateFriendsMixin, ObjectConfirmationOfFriendshipMixin, ObjectDeleteFriendMixin,
    ObjectSearchMixin, ObjectRePostMixin, ObjectMediaDetailMixin,
    ObjectCreateMediaMixin, ObjectDetailAlbumMixin, ObjectAlbumAllMixin,
    ObjectCreateAvatarMixin, ObjectSettingsProfileMixin, ObjectAudioMixin,
    ObjectBackColorMixin, ObjectAudioSerializersMixin, SearchAlbumAudioTrack, ObjectUpdateMixin, ObjectPermissionMixin,
    ObjectGroupsList, ObjectCreateMixin, ObjectGroupDetail, GroupFollowersChangeMixin, ObjectNewsFeed,
    ObjectUnreadMessage, ObjectPossibleFriends, ObjectRequestMessageUser, ObjectRequestMessageFriend, ObjectRequestAvatar,
    ObjectRequestCommentPhoto, ObjectRequestPost
)
from .serializers import (
    PersonSerializers, FriendSerializers, RePostSerializers, AudioSerializers, PhotoSerializers,
    VideoSerializes, GroupSerializers, ChatSerializers, PossibleFriendSerializers, AvatarSerializers,
    CommentSerializers, PostSerializers
)

import logging
# импортирум встроенный модуль логирования и дополняем его сообщениями
logger = logging.getLogger('django')


def StartPage(request): # наша стартовая старница перенаправляет пользователя
    if request.user.is_authenticated: # если он залогинен на новостную ленту
        logger.info('GET from View StartPage, user - {0}'.format(request.user.email))
        return redirect('person_news_feed_url', request.user.slug)
    else: # если нет на страницу входа
        logger.info('GET from View StartPage, user - Anonymous')
        return redirect('login_url')
# когда пользователь сидит через мобильное устройство
# предоставляем ему отдельную страницу с кнопками перехода, которые не поместились в нав-баре
def MediaMenu(request):
    logger.info('GET from View MediaMenu, user - {0}'.format(request.user.email))
    return render(request, 'project/menu-media.html')

class RegisterView(CustomRegisterUser, View):
    modelForm = PersonForm
    modelPerson = Person
    redirect_url = '/'
    template = 'project/register.html'

class LoginFormView(FormView):
    form_class = AuthenticationForm
    template_name = 'project/login.html'
    success_url = '/'

    def form_valid(self, form): # указываем базе форме проверка логин/пароля на валидность
        self.user = form.get_user()
        login(self.request, self.user)
        return super(LoginFormView, self).form_valid(form) # наш метод

    def form_invalid(self, form): # в случае некорректного ввода передаем сообщение об ошибке
        return self.render_to_response(self.get_context_data(form=form, error_message='*Введен неверный логин или пароль'))

class LogoutView(View):
    def get(self, request):
        logger.info('GET from View LogoutView, user - {0}'.format(request.user.email))
        logout(request)
        return redirect('/')

class PersonView(ObjectPersonMixin, View):
    modelPerson = Person
    modelChat = Chat
    modelFriend = Friend
    modelPermission = Permission
    modelGroup = Group
    template = 'project/router_users.html'

class PersonSettingsProfileView(ObjectSettingsProfileMixin, View):
    modelFormAvatar = AvatarForm
    modelPerson = Person
    modelFormPerson = PersonSettingsForm
    modelPermission = Permission
    template = 'project/settings_profile.html'

class PersonUpdateView(ObjectUpdateMixin, View):
    model = Person
    modelForm = PersonSettingsForm
    redirectUrl = 'person_settings_url'

class PermissionSettingsView(ObjectPermissionMixin, View):
    modelFriend = Friend
    modelPermission = Permission

class PostPersonView(ObjectPostMixin, View):
    modelObj = Person
    modelPost = Post
    modelContentType = ContentType

class PostDeleteView(ObjectGenericDeleteMixin, View):
    modelObj = Post

class PostRePostObjectView(ObjectRePostMixin, View):
    model_obj = Post
    modelRePost = Re_Post
    modelContentType = ContentType
    modelSerializers = RePostSerializers

class PersonAvatarView(ObjectCreateAvatarMixin, View):
    modelObj = Person
    modelAlbum = Album
    modelPhoto = Photo
    modelFormAvatar = AvatarForm
    modelContentType = ContentType
    redirectUrl = 'person_settings_url'

class PhotosPersonView(ObjectMediaDetailMixin, View):
    modelAlbum = Album
    modelAlbumForm = AlbumForm
    modelMedia = Photo
    modelMediaForm = PhotoForm
    templates = 'project/photos.html'
    modelChat = Chat
    modelPerson = Person

class AlbumAllPersonView(ObjectAlbumAllMixin, View):
    modelAlbum = Album
    modelFormAlbum = AlbumForm
    template = 'project/list_albums.html'
    modelPerson = Person

class CreateAlbumPersonView(ObjectCreateMediaMixin, View):
    modelObj = Person
    modelContentType = ContentType
    modelForm = AlbumForm
    redirectUrl = 'person_album_detail_url'
    baseRedirectUrl = 'person_photos_url'

class DetailAlbumPersonView(ObjectDetailAlbumMixin, View):
    modelAlbum = Album
    modelPhoto = Photo
    modelFormPhoto = PhotoForm
    template = 'project/album.html'
    modelChat = Chat
    modelPerson = Person

class CreatePhotoPersonView(ObjectCreateMediaMixin, View):
    modelObj = Person
    modelContentType = ContentType
    modelForm = PhotoForm
    baseRedirectUrl = 'person_photos_url'

class CreatePhotoInAlbumPersonView(ObjectCreateMediaMixin, View):
    modelObj = Person
    modelContentType = ContentType
    modelForm = PhotoForm
    redirectUrl = 'person_album_detail_url'
    Album = Album

# метод добавление не будем выносить в утилиты, так как он не большой
# и для добавления каждой медиа модели требует разные атрибуты этой модели, поэтому универсального миксина сделать не получится
def AddPhoto(request):
    # получаем данные через аякс
    obj_pk = request.POST.get('obj_pk') # забираем айди медиа модели
    obj = get_object_or_404(Photo, pk=obj_pk) # извлекаем ее из БД
    person = Person.objects.get(id=request.user.id)
    content_type = ContentType.objects.get_for_model(person)
    Photo.objects.create( # создаем новую уже на себя и заполняем атрибуты из модели родителя
        slug=request.user.slug,
        object_id=person.id,
        content_type=content_type,
        user=request.user,
        photo=obj.photo
    )
    logger.info('POST from View AddPhoto, user - {0}'.format(request.user.email))
    return HttpResponse()

class PhotoLikeView(ObjectLikeDislikeMixin, View):
    model = Photo
    modelLikeDislike = LikeDislike
    modelContentType = ContentType
    vote_type = LikeDislike.LIKE

class PhotoCommentView(ObjectCommentMixin, View):
    modelObj = Photo
    modelForm = CommentForm
    modelComment = Comment
    modelContentType = ContentType
    template = 'project/comment.html'

class PhotoUpdateCommentView(ObjectUpdateCommentMixin, View):
    modelComment = Comment
    modelForm = CommentForm

class PhotoRePostObjectView(ObjectRePostMixin, View):
    model_obj = Photo
    modelRePost = Re_Post
    modelContentType = ContentType
    modelSerializers = RePostSerializers

class PhotoDeleteView(ObjectGenericDeleteMixin, View):
    modelObj = Photo

class AlbumDeleteView(ObjectGenericDeleteMixin, View):
    modelObj = Album

class AudioPersonView(ObjectAudioMixin, View):
    modelAudioForm = AudioForm
    template = 'project/audio.html'
    modelPerson = Person
    modelChat = Chat

class AudioSerializersView(ObjectAudioSerializersMixin):
    modelAudio = Audio
    modelSerializers = AudioSerializers

class AlbumAudioTrackSerializers(SearchAlbumAudioTrack):
    modelPhoto = Photo
    modelSerializers = PhotoSerializers

class AudioDeleteView(ObjectGenericDeleteMixin, View):
    modelObj = Audio

class AudioSearchView(ObjectSearchMixin):
    modelObj = Audio
    modelPerson = Person
    serializer_class_Obj = AudioSerializers

class CreateAudioPersonView(ObjectCreateMediaMixin, View):
    modelObj = Person
    modelContentType = ContentType
    modelForm = AudioForm
    baseRedirectUrl = 'person_audio_url'

def AddAudio(request):
    obj_pk = request.POST.get('obj_pk')
    obj = get_object_or_404(Audio, pk=obj_pk)
    person = Person.objects.get(id=request.user.id)
    content_type = ContentType.objects.get_for_model(person)
    Audio.objects.create(
        slug=request.user.slug,
        object_id=person.id,
        content_type=content_type,
        user=request.user,
        author_track=obj.author_track,
        title_track=obj.title_track,
        audio=obj.audio
    )
    logger.info('POST from View AddAudio, user - {0}'.format(request.user.email))
    return HttpResponse()

class PersonVideoDetailView(ObjectMediaDetailMixin, View):
    modelMedia = Video
    modelMediaForm = VideoForm
    modelChat = Chat
    modelPerson = Person
    templates = 'project/video.html'

class PersonCreateVideoView(ObjectCreateMediaMixin, View):
    modelObj = Person
    modelForm = VideoForm
    modelContentType = ContentType
    baseRedirectUrl = 'person_video_url'

class PersonDeleteVideoView(ObjectGenericDeleteMixin, View):
    modelObj = Video

class VideoCommentView(ObjectCommentMixin, View):
    modelObj = Video
    modelForm = CommentForm
    modelComment = Comment
    modelContentType = ContentType
    template = 'project/comment.html'

class VideoCommentUpdateView(ObjectUpdateCommentMixin, View):
    modelComment = Comment
    modelForm = CommentForm

class VideoLikeView(ObjectLikeDislikeMixin, View):
    model = Video
    modelLikeDislike = LikeDislike
    modelContentType = ContentType
    vote_type = LikeDislike.LIKE

class VideoRePostObjectPersonView(ObjectRePostMixin, View):
    model_obj = Video
    modelRePost = Re_Post
    modelContentType = ContentType
    modelSerializers = RePostSerializers

class VideoSearchPersonView(ObjectSearchMixin):
    modelObj = Video
    modelPerson = Person
    serializer_class_Obj = VideoSerializes

def AddVideo(request):
    obj_pk = request.POST.get('obj_pk')
    obj = get_object_or_404(Video, pk=obj_pk)
    person = Person.objects.get(id=request.user.id)
    content_type = ContentType.objects.get_for_model(person)
    Video.objects.create(
        slug=request.user.slug,
        object_id=request.user.id,
        content_type=content_type,
        user=request.user,
        title_video=obj.title_video,
        description_video=obj.description_video,
        poster=obj.poster,
        video=obj.video
    )
    logger.info('POST from View AddVideo, user - {0}'.format(request.user.email))
    return HttpResponse()

class PostCommentView(ObjectCommentMixin, View):
    modelObj = Post
    modelForm = CommentForm
    modelComment = Comment
    modelContentType = ContentType
    template = 'project/comment.html'

class PostUpdateCommentView(ObjectUpdateCommentMixin, View):
    modelComment = Comment
    modelForm = CommentForm

class DeleteCommentView(ObjectGenericDeleteMixin, View):
    modelObj = Comment

class PostLikeView(ObjectLikeDislikeMixin, View):
    model = Post
    modelLikeDislike = LikeDislike
    modelContentType = ContentType
    vote_type = LikeDislike.LIKE

class DialogView(ObjectDialogMixin, View):
    model = Chat
    template = 'project/chat.html'
    templateForm = 'message_url'
    modelUser = Person

class MessageView(ObjectMessageMixin, View):
    model = Chat
    modelForm = MessageForm
    template = 'project/message.html'

class CreateMessageView(ObjectCreateMessageMixin, View):
    model = Chat
    redirect_url = 'message_url'

class UpdateMessageView(ObjectUpdateMessageMixin, View):
    model = Message
    modelForm = MessageForm

class DeleteMessageView(ObjectDeleteMessageMixin, View):
    model = Message

class PersonFriendsView(ObjectPersonMixin, View):
    modelPerson = Person
    modelChat = Chat
    modelFriend = Friend
    template = 'project/friends.html'

class PersonCreateFriendsView(ObjectCreateFriendsMixin, View):
    modelForm = FriendsForm
    modelContentType = ContentType
    modelUser = Person

class PersonConfirmationFriendsView(ObjectConfirmationOfFriendshipMixin, View):
    model = Friend
    modelUser = Person
    modelForm = FriendsForm

class PersonDeleteFriendView(ObjectDeleteFriendMixin, View):
    model = Friend

class SearchFriendView(ObjectSearchMixin):
    modelObj = Friend
    serializer_class_Obj = FriendSerializers
    modelPerson = Person
    serializer_class_Person = PersonSerializers

class ColorDeterminantView(ObjectBackColorMixin, View):
    pass

class GroupListView(ObjectGroupsList, View):
    modelGroup = Group
    modelGroupForm = GroupForm
    modelPerson = Person
    modelChat = Chat
    template = 'project/list_groups.html'

class GroupCreateView(ObjectCreateMixin, View):
    modelForm = GroupForm
    redirect_url = 'group_detail_url'

class GroupDetailView(ObjectGroupDetail, View):
    modelGroup = Group
    modelPerson = Person
    modelChat = Chat
    template = 'project/group.html'

class GroupCreateFollowers(GroupFollowersChangeMixin):
    modelGroup = Group
    serializerGroup = GroupSerializers

class GroupRemoveFollowers(GroupFollowersChangeMixin):
    modelGroup = Group
    serializerGroup = GroupSerializers

class GroupSearchView(ObjectSearchMixin):
    modelObj = Group
    modelPerson = Person
    serializer_class_Obj = GroupSerializers

class GroupsPostCreateView(ObjectPostMixin, View):
    modelObj = Group
    modelPost = Post
    modelContentType = ContentType

class PhotosGroupView(ObjectMediaDetailMixin, View):
    modelAlbum = Album
    modelAlbumForm = AlbumForm
    modelMedia = Photo
    modelMediaForm = PhotoForm
    templates = 'project/photos_group.html'
    modelChat = Chat
    modelPerson = Group

class GroupAvatarView(ObjectCreateAvatarMixin, View):
    modelObj = Group
    modelAlbum = Album
    modelPhoto = Photo
    modelFormAvatar = AvatarForm
    modelContentType = ContentType
    redirectUrl = 'group_settings_url'

class GroupSettingsProfileView(ObjectSettingsProfileMixin, View):
    modelFormAvatar = AvatarForm
    modelPerson = Group
    modelFormPerson = GroupSettingsForm
    modelPermission = Permission
    template = 'project/settings_profile.html'

class GroupUpdateView(ObjectUpdateMixin, View):
    model = Group
    modelForm = GroupSettingsForm
    redirectUrl = 'group_settings_url'

class CreatePhotoGroupView(ObjectCreateMediaMixin, View):
    modelObj = Group
    modelContentType = ContentType
    modelForm = PhotoForm
    baseRedirectUrl = 'group_photo_url'

class CreatePhotoInAlbumGroupView(ObjectCreateMediaMixin, View):
    modelObj = Group
    modelContentType = ContentType
    modelForm = PhotoForm
    redirectUrl = 'group_album_detail_url'
    Album = Album

class DetailAlbumGroupView(ObjectDetailAlbumMixin, View):
    modelAlbum = Album
    modelPhoto = Photo
    modelFormPhoto = PhotoForm
    template = 'project/album_group.html'
    modelChat = Chat
    modelPerson = Group

class AlbumAllGroupView(ObjectAlbumAllMixin, View):
    modelAlbum = Album
    modelFormAlbum = AlbumForm
    template = 'project/list_albums_group.html'
    modelPerson = Group

class CreateAlbumGroupView(ObjectCreateMediaMixin, View):
    modelObj = Group
    modelContentType = ContentType
    modelForm = AlbumForm
    redirectUrl = 'group_album_detail_url'
    baseRedirectUrl = 'group_photo_url'

class AudioGroupView(ObjectAudioMixin, View):
    modelAudioForm = AudioForm
    template = 'project/audio_group.html'
    modelPerson = Group
    modelChat = Chat

class CreateAudioGroupView(ObjectCreateMediaMixin, View):
    modelObj = Group
    modelContentType = ContentType
    modelForm = AudioForm
    baseRedirectUrl = 'group_audio_url'

class GroupVideoDetailView(ObjectMediaDetailMixin, View):
    modelMedia = Video
    modelMediaForm = VideoForm
    modelChat = Chat
    modelPerson = Group
    templates = 'project/video_group.html'

class GroupCreateVideoView(ObjectCreateMediaMixin, View):
    modelObj = Group
    modelForm = VideoForm
    modelContentType = ContentType
    baseRedirectUrl = 'group_video_url'

class NewsFeed(ObjectNewsFeed, View):
    modelPhoto = Photo
    modelAudio = Audio
    modelVideo = Video
    modelPost = Post
    modelPerson = Person
    modelContentType = ContentType
    modelFriend = Friend
    modelPermission = Permission
    modelGroup = Group
    template = 'project/news_feed.html'

class UnreadMessagesView(ObjectUnreadMessage):
    modelChat = Chat
    modelSerializer = ChatSerializers

class PossibleFriendsView(ObjectPossibleFriends):
    modelFriend = Friend
    modelSerializer = PossibleFriendSerializers

class RequestMessageUserView(ObjectRequestMessageUser):
    modelChat = Chat
    modelSerializer = ChatSerializers

class RequestMessageFriendView(ObjectRequestMessageFriend):
    modelChat = Chat
    modelSerializer = ChatSerializers

class RequestAvatarView(ObjectRequestAvatar):
    modelAlbum = Album
    modelSerializer = AvatarSerializers

class RequestCommentPhotoView(ObjectRequestCommentPhoto):
    modelObj = Photo
    modelComment = Comment
    modelContentType = ContentType
    modelSerializer = CommentSerializers

class RequestCommentVideoView(ObjectRequestCommentPhoto):
    modelObj = Video
    modelComment = Comment
    modelContentType = ContentType
    modelSerializer = CommentSerializers

class RequestCommentPostView(ObjectRequestCommentPhoto):
    modelObj = Post
    modelComment = Comment
    modelContentType = ContentType
    modelSerializer = CommentSerializers

class RequestPostView(ObjectRequestPost):
    modelPost = Post
    modelSerializer = PostSerializers

