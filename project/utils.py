from django.shortcuts import render, HttpResponse, redirect, reverse, get_object_or_404
from django.utils import timezone
from django.urls import NoReverseMatch
from itertools import chain
import json

from collections import namedtuple
from math import sqrt
import random
from PIL import Image

from rest_framework.response import Response
from rest_framework.views import APIView
from .service import get_q, get_num_tab

import logging
# импортирум встроенный модуль логирования и дополняем его сообщениями
logger = logging.getLogger('django')


# описываем работу с созданием пользователей через вэб интерфейс
class CustomRegisterUser:
    modelForm = None
    modelPerson = None
    redirect_url = None
    template = None

    def get(self, request): # по гету просто передаем форму
        ctx = {}
        form = self.modelForm()
        ctx['form'] = form
        logger.info('GET: CustomRegisterUser')
        return render(request, self.template, ctx)

    def post(self, request):
        ctx = {}
        form = self.modelForm(request.POST) # в случае отправки пользователем заполненной формы получаем эти данные для их дальнейшей обработки
        ctx['form'] = form

        if form.is_valid(): # проверяем форму на соответсвие
            # извлекаем полученные данные из формы
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            phone = form.cleaned_data['phone']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            middle_name = form.cleaned_data['middle_name']
            date_birth = form.cleaned_data['date_birth']
            gender = form.cleaned_data['gender']

            # для того, что бы потом применить их к нашему кастомному методу создания пользователя
            obj = self.modelPerson.objects.create_user(
                email=email,
                password=password
            )
            obj.phone = phone
            obj.last_name = last_name
            obj.first_name = first_name
            obj.middle_name = middle_name
            obj.date_birth = date_birth
            obj.gender = gender
            obj.save()
            logger.info('POST: CustomRegisterUser')
            return redirect('/login/') # в случаем успешной валидации формы и создания модели пользователя, переводим юзера на страницу входа на сайт
        logger.info('POST: CustomRegisterUser')
        return render(request, self.template, ctx) # если форма была не валидна возвращаем пользователя на страницу регистрации с данными его формы, для их корректировки

# миксин вывода данных о пользователе, т.е. его личная страница
class ObjectPersonMixin:
    modelPerson = None
    modelChat = None
    modelPermission = None
    modelFriend = None
    modelGroup = None
    template = None

    def get(self, request, slug): # ключом для отображения страницы служит слаг пользователя
        ctx = {}
        person = self.modelPerson.objects.get(slug=slug) # получаем нашего пользователя
        users = self.modelPerson.objects.all().exclude(slug=slug) # на странице нам понадобятся данные других пользователей, всех кроме самого юзера
        ctx['person'] = person
        ctx['users'] = users
        # так как модель френда не всегда может означать дружбу между пользователя мы отфильтровываем именно друзей нашего пользователя
        ctx['count_friends'] = self.modelFriend.objects.filter(object_id=person.pk).filter(possible_friends=None).filter(waiting_confirmations=None).count()
        # репостить наши модели мы можем в чаты либо диалоги, диалоги мы можем выводить через модель юзера, а вот чаты извлечем сразу
        ctx['chats'] = self.modelChat.objects.filter(members__in=[request.user.id]).filter(type=self.modelChat.CHAT)

        try:
            # так как модель ограничения на странице должен видеть сторонний пользователь, а не мы, то при заходе
            # на свою сраницу под собой нам модель ограничения не нужна и мы ее во вью не устанавливаем и, что бы избежать ошибки при загрузке страницы
            # ловим нашу ошибку и сбрасываем ее
            permission = self.modelPermission.objects.filter(slug=person.slug)
            ctx['permissions'] = permission
        except AttributeError:
            pass

        try:
            # наша метод применяется не только для отображения данных о пользователе, а так же при отображении его участия в группах,
            # поэтому так же прописываем мы это не везде, а что бы избежать ошибок, ловим их
            ctx['followGroups'] = self.modelGroup.objects.filter(followers=person)
        except:
            pass

        # дополняем логи своим комментарием, для быстрого поиска в случае возникновения проблемы
        logger.info('GET: ObjectPersonMixin, user - {0}'.format(request.user.email))
        request.session.clear_expired() # в целях безопасности очищаем ссесии пользователя с истекшим сроком, что бы их не могли использовать через теже куки
        return render(request, self.template, ctx)

class ObjectSettingsProfileMixin:
    modelFormAvatar = None
    modelPerson = None
    modelFormPerson = None
    modelPermission = None
    template = None

    # в мисин настроект страницы пользователя делаем только гет, посты обрабатываются отдельнор для каждой формы, так удобнее
    def get(self, request, slug):
        ctx = {}
        person = self.modelPerson.objects.get(slug=slug)
        ctx['person'] = person
        ctx['formPerson'] = self.modelFormPerson(instance=person)
        ctx['formAvatar'] = self.modelFormAvatar
        ctx['permissions'] = self.modelPermission.objects.filter(slug=slug)
        logger.info('GET: ObjectSettingsProfileMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# миксин для работы с чатами
class ObjectDialogMixin:
    model = None
    template = None
    templateForm = None
    modelUser = None

    def get(self, request):
        ctx = {}
        chats = self.model.objects.filter(members__in=[request.user.id]) # подгружаем чаты только в которых мы участники
        ctx['user'] = request.user
        ctx['chats'] = chats
        ctx['users'] = self.modelUser.objects.all().exclude(pk=request.user.pk) # данный query set будет нужен для корректного отображения списка пользователей в шаблоне
        logger.info('GET: ObjectDialogMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

    def post(self, request):
        # создания чата происходит только после входных данных с аякса
        if request.is_ajax():
            # мы получаем либо запрос на создание диалога, либо создание чата
            # две переменные сразу прийти не могут
            user_one = request.POST.get('user_one') # переменная отвечающая за создание диалога, которая хранит айди юзера
            user_all = request.POST.get('user_all') # переменная отвеяающая за чат, хранит айди всех участников чата
            # обе переменные не хранят айди юзера, который и создает чат, потому что мы всегда его можем получить если наш метод содержит request
            if user_one:
                first = self.modelUser.objects.get(id=user_one) # извлекаем юзера с которым хотим начать диалог
                # далее мы проверяем наличие действующего диалога с этим юзером, нам не нужно плодить однотипные диалоги
                chat = self.model.objects.filter(
                    members=request.user, type=self.model.DIALOG # указываем тип беседы, в данном случае диалог
                ).filter(
                    members=user_one, type=self.model.DIALOG
                )
                if chat: # выполняем проверку есть уже чат с персонажем или нет
                    for ch in chat:
                        chat_id = ch.pk # если чат есть мы забираем его айди, который является ключом чата и переводим пользователя на диалог
                        logger.info('POST: ObjectDialogMixin, user - {0}'.format(request.user.email))
                        return redirect(reverse(self.templateForm, kwargs={'chat_id': chat_id}))
                elif chat.count() == 0: # если наш query set пуст то создаем диалог
                    new_chat = self.model.objects.create() # создавать будет через метод create для модели
                    new_chat.type = new_chat.DIALOG # обязательно указываем тип, по дефолту у нас чат
                    # добавляем участников и сохраняем
                    new_chat.members.add(request.user)
                    new_chat.members.add(first)
                    new_chat.save()
                    chat_id = new_chat.pk # потом так же извлекаем айди и переводим
                    logger.info('POST: ObjectDialogMixin, user - {0}'.format(request.user.email))
                    return redirect(reverse(self.templateForm, kwargs={'chat_id': chat_id}))
            else: # если же пришел список участников
                lenArr = len(user_all) # так как входные данные являются срокой переберем их и подгоним под корректный массив
                arr = []
                i = 0
                while i < lenArr: # наша срока уже является массивом, но создержит запятые и пробелы, а нам нужен чистый числовой массив
                    s_int = '' # обозначим переменную которая будет записывать числа в строке на себя
                    a = user_all[i]
                    while '0' <= a <= '9': # делаем символьную выборку в нашей строке путем перебора
                        s_int += a # приписываем значение если оно попдает под нашу установку
                        i += 1 # если символ является числом делаем шаг вперед в нашем массиве
                        if i < lenArr: # проверяем есть куда шагать или нет, если есть то меняем значени "а" на следующий символ по массиву
                            a = user_all[i]
                        else:
                            break
                    i += 1 # если массив неокончен, двигаем нашу i, что бы в случае несоотвествия символов, мы не вернулись туда где остановился внутренний цикл
                    if s_int != '': # если в строке была хотя одна цифра записываем ее уже преобразуя в натуральное число
                        arr.append(int(s_int))

                new_chat = self.model.objects.create() # аналогично с диалогом создаем и чат
                new_chat.members.add(request.user)
                for user in arr: # так как мы не можем через add добавить сразу "пачку" пользователей, добавим их перебором через массив
                    new_chat.members.add(user)
                new_chat.save()
                chat_id = new_chat.pk # по аналогии берем ключ и делаем перевод
                logger.info('POST: ObjectDialogMixin, user - {0}'.format(request.user.email))
                return redirect(reverse(self.templateForm, kwargs={'chat_id': chat_id}))

# миксин работы с сообщениями
class ObjectMessageMixin:
    model = None
    modelForm = None
    template = None

    def get(self, request, chat_id):
        # при загрузке чата проверим прочитаны наши сообщения или нет
        try:
            chat = self.model.objects.get(id=chat_id)
            if request.user in chat.members.all(): # делаем проверку на принадлежность пользователя к чату, что бы у него не было прямого доступа к чужой переписке
                chat.message_set.filter(is_read=False).exclude(author=request.user).update(is_read=True) # если сообщения написаны не пользователем, а его собеседников то отмечаем их как прочитанные
            else:
            # в случае отсутвия доступа к чату или наличия такого чата возвращаем пустое значение, котрое потом обработаем в шаблоне
                chat = None
        except self.model.DoesNotExist:
            chat = None
        ctx = {}
        ctx['user'] = request.user.email
        ctx['chat'] = chat
        ctx['form'] = self.modelForm
        logger.info('GET: ObjectMessageMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

    def post(self, request, chat_id):
        # создаем сообщение так же по аяксу
        chat = self.model.objects.get(id=chat_id)
        form = self.modelForm(request.POST)
        data_message = request.POST.get('message')
        if form.is_valid(): # проверяем форму на условное соответсвие
            message = form.save(commit=False)
            message.chat_id = chat_id
            message.author = request.user
            message.message = data_message
            message.save()
            chat.last_message = message # обязательно обновляем данные о последнем сообщение в чате
            chat.save()
        logger.info('POST: ObjectMessageMixin, user - {0}'.format(request.user.email))
        return HttpResponse() # так как запрос по аяксу и возвращаем мы данные другими способами, то укажем обычный респонс для более быстрого ответа от сервера

# миксин был создан для моментального формирования диалога между пользователями
# что бы любой пользователь находясь на странице какого либо человека мог ему написать
class ObjectCreateMessageMixin:
    model = None
    redirect_url = None

    def get(self, request, pk): # ключом является айди пользователя на странице которого мы находимся
        # классическая проверка на наличие имеющейся беседы и в случае ее отсутствия создания последней
        chats = self.model.objects.filter(
            members=request.user.id,
            type=self.model.DIALOG
        ).filter(
            members=pk,
            type=self.model.DIALOG
        )
        if chats.count() == 0:
            chat = self.model.objects.create()
            chat.type = chat.DIALOG
            chat.members.add(request.user)
            chat.members.add(pk)
            chat.save()
        elif chats.count() == 1:
            chat = chats.first()
        logger.info('GET: ObjectCreateMessageMixin, user - {0}'.format(request.user.email))
        return redirect(reverse(self.redirect_url, kwargs={'chat_id': chat.id}))

# миксин через который выполняется обновление сообщений
class ObjectUpdateMessageMixin:
    model = None
    modelForm = None

    def post(self, request, chat_id):
        if request.is_ajax(): # опять же все через аякс
            oldMessage = request.POST.get('old_message') # получаем старое сообщение
            message = request.POST.get('message') # обновленное
            slug = request.POST.get('slug_message') # слаг нашего сообщения
            obj = self.model.objects.get(slug_message__iexact=slug) # выгружаем
            form = self.modelForm(request.POST, instance=obj) # подставляем данные сообщания в форму
            if form.is_valid():
                update_message = form.save(commit=False)
                if update_message.message == oldMessage: # так как обновленное сообщение мы уже создали, то теперь нам необходимо сверить изменилось в нем что то или нет
                    update_message.message = message # если ничего не изменилось то просто пересохраняем его
                    update_message.save()
                else:
                    update_message.message = message
                    update_message.is_update = True # если изменилось то меняет булевое значение атрибута отвечающего за статус обновления
                    update_message.date_update = timezone.datetime.now() # устанавливаем дату обновления
                    update_message.save()
                logger.info('POST: ObjectUpdateMessageMixin, user - {0}'.format(request.user.email))
                return HttpResponse() # опять же все на аяксе так что не будем тратить ресурсы машины и возвращаем пустой респонс

# мексим удаления сообщений
class ObjectDeleteMessageMixin:
    model = None

    def post(self, request, chat_id):
        # ничего особого придумывать не будем, удаляем сообщения при получении его уникального слага
        if request.is_ajax():
            slug = request.POST.get('slug_message')
            obj = self.model.objects.get(slug_message__iexact=slug)
            obj.delete()
            logger.info('POST: ObjectDeleteMessageMixin, user - {0}'.format(request.user.email))
            return HttpResponse()

# миксин отвечает за создание файлов через классическую отправку формы
class ObjectCreateMixin:
    modelForm = None
    template = None
    redirect_url = None

    def post(self, request):
        bound_form = self.modelForm(request.POST, request.FILES)

        if bound_form.is_valid(): # проверяем форму
            new_obj = bound_form.save(commit=False) # делаем предварительно сохранение для дальнейшего ректирования
            new_obj.user = request.user # указываем автора создания афайла
            new_obj.save()
        logger.info('POST: ObjectCreateMixin, user - {0}'.format(request.user.email))
        return redirect(self.redirect_url, new_obj.slug) # возвращаем пользователя на страницу где он и загружал файл

# миксин классического обновления данных без участия аякса
class ObjectUpdateMixin:
    model = None
    modelForm = None
    redirectUrl = None

    def post(self, request, slug):
        obj = self.model.objects.get(slug__iexact=slug)
        bound_form = self.modelForm(request.POST, request.FILES, instance=obj) # так как объект у нас уже есть, мы его выгружаем в форме модели

        if bound_form.is_valid(): # выполняем проверку форму
            new_obj = bound_form.save()
        logger.info('POST: ObjectUpdateMixin, user - {0}'.format(request.user.email))
        return redirect(self.redirectUrl, new_obj.slug) # и возвращаем пользователя на страницу где он и обновлял данные

# мисин создания постов
class ObjectPostMixin:
    modelObj = None
    modelPost = None
    modelContentType = None

    # метод гет отсутствует так как "пост" является суб классом и мы его извлекаем иначе

    def post(self, request):
        # создание постов так же через аякс запрос
        slug_obj = request.POST.get('slug')
        message = request.POST.get('message')
        obj = get_object_or_404(self.modelObj, slug__iexact=slug_obj) # так как иметь посты может не только юзер, но и группа, то проверяем наличие объекта в бд, в случае несоответствия вернем ошибку 404
        content_type = self.modelContentType.objects.get_for_model(obj) # наш суб класс требует тип объекта модели к которому он будет привязан, получаем его из встроенной модели типа контента

        self.modelPost.objects.create( # создаем модель методом create и заполняем данные в ручную
            content_type=content_type,
            object_id=obj.pk,
            user=request.user,
            message=message
        )
        logger.info('POST: ObjectPostMixin, user - {0}'.format(request.user.email))
        return HttpResponse()

# так как модель репоста нам в шаблоне нигде показывать не нужно мы сразу делаем мисин с подключением django rest
class ObjectRePostMixin(APIView): # был унаследован базовый класс потому что с ним легче получать входные данные с аякс запросов
    model_obj = None
    modelRePost = None
    modelContentType = None
    modelSerializers = None

    def get(self, request):
        # забираем входные данные и устанавливаем типо контента
        obj_pk = request.GET.get('obj_pk')
        obj_re_post_pk = request.GET.get('obj_re_post_pk')
        obj = get_object_or_404(self.model_obj, pk=obj_pk)
        content_type = self.modelContentType.objects.get_for_model(obj)

        # так как модель репоста у нас уникальна то мы должны всегда проверят ее наличие, что бы не сделать дубль на один и тот же объект модели
        try:
            rePosts = self.modelRePost.objects.get(id=obj_re_post_pk) # забираем именно объект модели, потому что с ним потом можно будет работать

            old_rec = []
            for recipient in rePosts.recipients.all(): # забираем имеющихся юзеров кто уже делал репост объекта модели и переводим его в массив
                old_rec.append(recipient.pk)

            new_rec = [request.user.pk] # заносим себя как нового участника в списке юзеров
            result = list(set(new_rec) - set(old_rec)) # делаем сверку через метод сед, который позволит исключить дубляжи в массивах и проверяем есть ли "я" среди других участников,
                                                        # если меня нет то возвращается пустой список, ставим именно "себя" в начало, чтобы не тратить время на дальнейшуюю переборку участников
            for user in result: # добавляем полученные данные
                rePosts.recipients.add(user)
            query_set = self.modelRePost.objects.filter(pk=rePosts.pk) # так как объект не может быть сериализован, мы достаем query set
            serializers = self.modelSerializers(query_set, many=True) # сериализуем полученную модель и выводим полученные данные

        except:
            # если мы не находим объект репоста к модели, то создаем новый и заполняем в ручную
            rePosts = self.modelRePost.objects.create(
                content_type=content_type,
                object_id=obj_pk,
                re_posts=True
            )
            # далее по аналогии добавляем себя как участника и сериализуем модель
            rePosts.recipients.add(request.user.pk)
            query_set = self.modelRePost.objects.filter(pk=rePosts.pk)
            serializers = self.modelSerializers(query_set, many=True)
        logger.info('GET: ObjectRePostMixin, user - {0}'.format(request.user.email))
        return Response(serializers.data) # возвращаем нашу модель с выводом данных о ней

# миксин создания комментариев
class ObjectCommentMixin:
    modelObj = None
    modelComment = None
    modelForm = None
    modelContentType = None
    template = None

    def get(self, request, id): # ключом является айди объекта модели, который хотим комментировать
        ctx = {}
        obj = get_object_or_404(self.modelObj, id=id) # достаем модель объекта, которую хотим комментировать
        content_type = self.modelContentType.objects.get_for_model(obj)
        comments = self.modelComment.objects.filter(object_id=obj.id).filter(content_type=content_type) # достаем комментарии принадлежащие этой модели
        form = self.modelForm(request.GET)
        ctx['comments'] = comments
        ctx['comment_form'] = form
        logger.info('GET: ObjectCommentMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

    def post(self, request, id):
        # при создании комментария участвует аякс метод, но форма комментария все равно отправляется
        obj = get_object_or_404(self.modelObj, id=id)
        form = self.modelForm(request.POST)
        if form.is_valid(): # проверяем форму и далее в ручную прописываем значения которые будут являться атрибутами модели
            slug = obj.slug
            content_type = self.modelContentType.objects.get_for_model(obj)
            object_id = obj.id
            content = form.cleaned_data['content'] # таким образом мы напрямую из формы извлекаем данные
            parent = None

            # так как сообщения у нас деляться на родительские и дочерние, то нам важно понимать мы работаем с родителем или нет
            try:
                parent_id = int(request.POST.get('parent_id')) # мы пытемся извлечь родителя из запроса если это дочерний комментарий

            except:
                parent_id = None

            if parent_id: # если родитель был то извлекаем его
                parent_qs = self.modelComment.objects.filter(id=parent_id)
                if parent_qs.exists(): # если он существует
                    parent = parent_qs.first() # берем его как объект и записываем в переменную, first or last вообще не важно, так как объект один

            self.modelComment.objects.create( # в форму мы не сможем добавить объект parent, поэтому создаем модель через метод create
                slug=slug,
                content_type=content_type,
                object_id=object_id,
                user=request.user,
                content=content,
                parent=parent
            )
            logger.info('POST: ObjectCommentMixin, user - {0}'.format(request.user.email))
            return HttpResponse()

# миксин обновления модели комментария
class ObjectUpdateCommentMixin:
    modelComment = None
    modelForm = None

    def post(self, request, id): # ключом так же является айди объекта модели к которому он принадлежит
        if request.is_ajax():
            # метод схож с обновлением сообщения, разница только в именах атрибута модели и именах ключей (нарушается принцип DRY, создан метод ради экономии времени, так сразу не была в расчете утиная типизация)
            oldComment = request.POST.get('old_comment')
            comment = request.POST.get('content')
            id_comment = request.POST.get('id_comment')
            obj = self.modelComment.objects.get(id=id_comment)
            form = self.modelForm(request.POST, instance=obj)
            if form.is_valid():
                update_comment = form.save(commit=False)
                if update_comment.content == oldComment:
                    update_comment.content = comment
                    update_comment.save()
                else:
                    update_comment.content = comment
                    update_comment.is_update = True
                    update_comment.modified = timezone.datetime.now()
                    update_comment.save()
                logger.info('POST: ObjectUpdateCommentMixin, user - {0}'.format(request.user.email))
                return HttpResponse()

# мискин удаления объектов
class ObjectGenericDeleteMixin:
    modelObj = None

    # получаем айди по аяксу и удаляем, ключей нет так как метод работает с большинством моделей проекта и ключ только усложнит работу
    def post(self, request):
        id_obj = request.POST.get('id_obj')
        obj = self.modelObj.objects.get(id=id_obj)
        obj.delete()
        logger.info('POST: ObjectGenericDeleteMixin, user - {0}'.format(request.user.email))
        return HttpResponse()

# миксин формирования лайков и дизлайков
class ObjectLikeDislikeMixin:
    model = None
    modelLikeDislike = None
    modelContentType = None
    vote_type = None

    def post(self, request):
        # все операции через аякс
        id = request.POST.get('obj_id') # переменная хранит айди объекта, на котором будет отметка лайк или дизлайк
        obj = self.model.objects.get(id=id) # выводим объект из базы

        # объект лайк-дизлайк так же должен быть в единственном экземпляре, если объекта не было ранее создаем новый
        try:
            likedislike = self.modelLikeDislike.objects.get(
                content_type=self.modelContentType.objects.get_for_model(obj),
                object_id=obj.id,
                user=request.user
            )
            if likedislike.vote is not self.vote_type: # проверяем у объекта наличие голоса
                likedislike.vote = self.vote_type # если его нет то навязываем его модели
                likedislike.save(update_fields=['vote']) # и сохраняем
                result = True
            else:
                likedislike.delete() # если голос был, то мы его удаляем, потому что мы не можем за один и тот же объект голосовать несколько раз
                result = False

        except self.modelLikeDislike.DoesNotExist:
            obj.votes.create(user=request.user, vote=self.vote_type)
            result = True

        logger.info('POST: ObjectLikeDislikeMixin, user - {0}'.format(request.user.email))
        return HttpResponse( # возвращаем в респонсе джейсон объект, который в дальнейшем расшифровываем и используем в шаблоне
            json.dumps({
                'result': result,
                'like_count': obj.votes.likes().count()
            }),
            content_type='application/json'
        )

# миксин по созданию медиа объектов
class ObjectCreateMediaMixin:
    modelObj = None
    modelContentType = None
    modelForm = None
    redirectUrl = None
    baseRedirectUrl = None
    Album = None

    def post(self, request, slug):
        form = self.modelForm(request.POST, request.FILES) # указываем, что форма должна так же принимать и файлы
        obj = self.modelObj.objects.get(slug=slug)
        content_type = self.modelContentType.objects.get_for_model(obj)

        if form.is_valid(): # классическая проверка и сохранения нашей модели с медиа файлом
            new_media = form.save(commit=False)
            new_media.slug = slug
            new_media.content_type = content_type
            new_media.object_id = obj.id
            new_media.user = request.user
            new_media.save()

        # так как миксин используется для сохранения всех типов медиа файлом, в том числе и фото
        # то мы делаем проверку на актуальность использования атрибута модели "Альбом"
        try:
            if self.Album: # так как фото имеет данный атрибут мы проверяем
                album_id = form.cleaned_data['album'] # указана ли в форме принадлежность фото к альбому
                album = self.Album.objects.get(id=album_id.id)
                album.photo = new_media # если да, то находим альбом и обновляем данные о содержании им фото
                album.save()
                logger.info('POST: ObjectCreateMediaMixin, user - {0}'.format(request.user.email))
                return redirect(self.redirectUrl, new_media.slug, album_id.id) # если альбом есть возвращаем на страницу с альбомом
            else:
                logger.info('POST: ObjectCreateMediaMixin, user - {0}'.format(request.user.email))
                return redirect(self.redirectUrl, new_media.slug, new_media.id) # если нет возвращаем в "галлерею"
        except:
            logger.info('POST: ObjectCreateMediaMixin, user - {0}'.format(request.user.email))
            return redirect(self.baseRedirectUrl, slug) # для всех остальных объектов просто делаем возврат на страницу загрузки

# миксим создан специально для создания аватара
class ObjectCreateAvatarMixin:
    modelObj = None
    modelAlbum = None
    modelPhoto = None
    modelFormAvatar = None
    modelContentType = None
    redirectUrl = None

    def post(self, request, slug):
        obj = self.modelObj.objects.get(slug__iexact=slug)
        formAvatar = self.modelFormAvatar(request.POST, request.FILES)
        content_type = self.modelContentType.objects.get_for_model(obj)

        if formAvatar.is_valid():
            new_media = formAvatar.save(commit=False)
            new_media.slug = slug
            new_media.content_type = content_type
            new_media.object_id = obj.id
            new_media.user = request.user
            new_media.save()

            # папка "Аватар" может быть только одна у пользователя или группы, ее можно как создать самостоятельно
            # либо загрузить аватр через форму
            try:
                album = self.modelAlbum.objects.get(slug__iexact=slug, descriptionAlbum='Аватар') # так как папка должна быть уникальна мы проверяем ее наличие, что бы не плодить копии
                album.photo = new_media # прикрепляем к альбому "Аватар" наше фото
                album.save()
                new_media.album = album # и указываем принадлежность фото к альбому "Аватар"
                new_media.save()
            except self.modelAlbum.DoesNotExist:
                newAlbum = self.modelAlbum.objects.create( # если ранее "Аватаров" не было то создаем новый
                    slug=slug,
                    content_type=content_type,
                    object_id=obj.id,
                    descriptionAlbum='Аватар', # даем имя
                    photo=new_media # навязываем ему фото
                )
                new_media.album = newAlbum # так же к фото привязываем альбом
                new_media.save()
            logger.info('POST: ObjectCreateAvatarMixin, user - {0}'.format(request.user.email))
            return redirect(self.redirectUrl, slug)

# миксин который позволяет получить данные альбома
class ObjectDetailAlbumMixin:
    modelAlbum = None
    modelPhoto = None
    modelFormPhoto = None
    template = None
    modelChat = None
    modelPerson = None

    def get(self, request, slug, id): # используются два ключа, слаг пользователя или группы и айди альбома
        ctx = {}
        # выгружаем все интересующие нас данные
        album = self.modelAlbum.objects.get(id=id)
        ctx['album'] = album
        ctx['photos'] = self.modelPhoto.objects.filter(album=album)
        ctx['formPhoto'] = self.modelFormPhoto
        ctx['chats'] = self.modelChat.objects.filter(members__in=[request.user.id]).filter(type=self.modelChat.CHAT)
        ctx['person'] = self.modelPerson.objects.get(slug=slug)
        logger.info('GET: ObjectDetailAlbumMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# миксин для работы с медиа объектами
class ObjectMediaDetailMixin:
    modelAlbum = None
    modelAlbumForm = None
    modelMedia = None
    modelMediaForm = None
    templates = None
    modelChat = None
    modelPerson = None

    def get(self, request, slug): # здесь в отличии от альбома ключ только один, слаг юзера
        ctx = {}
        if self.modelAlbum: # так как не везде требутеся "альбом" провереям его наличие, что бы не получить исключение
            ctx['albums'] = self.modelAlbum.objects.filter(slug__iexact=slug)[:4] # для более красивой отрисоки альбомов на странице мы ограничиваем их количество для отображения
            ctx['formAlbum'] = self.modelAlbumForm
        ctx['media'] = self.modelMedia.objects.filter(slug__iexact=slug)
        ctx['formMedia'] = self.modelMediaForm()
        ctx['chats'] = self.modelChat.objects.filter(members__in=[request.user.id]).filter(type=self.modelChat.CHAT)
        ctx['person'] = self.modelPerson.objects.get(slug=slug)
        logger.info('GET: ObjectMediaDetailMixin, user - {0}'.format(request.user.email))
        return render(request, self.templates, ctx)

# миксин для отображения списка альбомов, так как большиство данных, которые есть в медиа миксине нам не нужны,
# проще было создать новый миксин
class ObjectAlbumAllMixin:
    modelAlbum = None
    modelFormAlbum = None
    template = None
    modelPerson = None

    def get(self, request, slug):
        ctx = {}
        ctx['albums'] = self.modelAlbum.objects.filter(slug=slug)
        ctx['formAlbum'] = self.modelFormAlbum
        ctx['person'] = self.modelPerson.objects.get(slug=slug)
        logger.info('GET: ObjectAlbumAllMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# миксин для выгрузки данных аудио файлов, создан по принципу и ObjectAlbumAllMixin
class ObjectAudioMixin:
    modelAudioForm = None
    template = None
    modelPerson = None
    modelChat = None

    def get(self, request, slug):
        ctx = {}
        ctx['formAudio'] = self.modelAudioForm
        ctx['person'] = self.modelPerson.objects.get(slug=slug)
        ctx['chats'] = self.modelChat.objects.filter(members__in=[request.user.id]).filter(type=self.modelChat.CHAT)
        logger.info('GET: ObjectAudioMixin, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# миксин который сериализует аудио файлы
class ObjectAudioSerializersMixin(APIView):
    modelAudio = None
    modelSerializers = None

    def get(self, request):
        slug = request.GET.get('slug') # слаг пользователя
        checked = request.GET.get('checked') # положение медиатеки
        # так как мы не сразу выгружаем все аудио файлы, а смотрим на положение медиатеки на которой находится пользователь,
        # то выполняем простую проверку, которая
        if checked == '1':
            Audio = self.modelAudio.objects.filter(slug=slug) # либо предоставляет аудио пользователя
            AudioSerializers = self.modelSerializers(Audio, many=True)
        else:
            Audio = self.modelAudio.objects.all() # или подгружает весь список треков
            AudioSerializers = self.modelSerializers(Audio, many=True)
        logger.info('GET: ObjectAudioSerializersMixin, user - {0}'.format(request.user.email))
        return Response(AudioSerializers.data) # далее сериализованные данные выводим через js на страницу

# метод поиска обложки альбомов для наших аудиотреков
class SearchAlbumAudioTrack(APIView):
    modelPhoto = None
    modelSerializers = None

    # обложки мы загружаем самостоятельно, прописываем имя группы альбому
    # запрос на альбом поступает только тогда, когда подошла очеред очередного трека для исполнения
    # за ранее все альбому не прогружаются
    def get(self, request):
        author_track = request.GET.get('author_track')
        # в качетсве условной БД хранения обложек был выбран пользователь "тест" на который и производится загрузка альбомов
        photo = self.modelPhoto.objects.filter(slug=16131596871613159687).filter(descriptionPhoto=author_track)[:1] # важно указать имя группы максимально корректно, что бы нашлось совпадение по автору трека
        album = self.modelSerializers(photo, many=True)
        logger.info('GET: SearchAlbumAudioTrack, user - {0}'.format(request.user.email))
        return Response(album.data)

# миксин создания модели дружбы
class ObjectCreateFriendsMixin:
    modelContentType = None
    modelForm = None
    modelUser = None

    def post(self, request, slug):
        if request.is_ajax():
            possible_friend = request.POST.get('possible_friend') # получаем айди юзера с которым хотим дружить
            user_obj = self.modelUser.objects.get(id=possible_friend)
            content_type = self.modelContentType.objects.get_for_model(user_obj)
            # так как модель дружбы создается для кадого пользователя своя, то мы готовим сразу две формы для создания моделей
            form1 = self.modelForm(request.POST)
            form2 = self.modelForm(request.POST)

            # при отправке запроса на дружбу сразу же мы не указываем пользователя как друга
            # мы ждем от него подтверждения, чито он тоже хочет с нами дружить
            if form1.is_valid():
                new_form1 = form1.save(commit=False)
                new_form1.slug = user_obj.slug
                new_form1.content_type = content_type
                new_form1.object_id = user_obj.pk
                new_form1.possible_friends = request.user # мы как подавшие заявку попадает в категорию "возможные друзья", такую модель увидит адресат
                new_form1.save()
            if form2.is_valid():
                new_form2 = form2.save(commit=False)
                new_form2.slug = slug
                new_form2.content_type = content_type
                new_form2.object_id = request.user.id
                new_form2.waiting_confirmations = user_obj # мы же получим модель "ожидания подтверждения", что позволяет нам понимать, что запрос мы уже отправили и должны дождаться реакции адресата
                new_form2.save()
            logger.info('POST: ObjectCreateFriendsMixin, user - {0}'.format(request.user.email))
            return HttpResponse()

# миксин подтверждения дружбы
class ObjectConfirmationOfFriendshipMixin:
    model = None
    modelForm = None
    modelUser = None

    # если нам пришел запрос на дружбу
    def post(self, request, slug):
        if request.is_ajax():
            user_waiting = request.POST.get('friend_id') # получаем айди пользователя подавшего заявку
            obj_user_waiting = self.modelUser.objects.get(id=user_waiting) # извлекаем модель юзера подавшего заявку
            request_id = request.POST.get('request_id') # получаем айди модели "фриенд" где мы адресат, что бы не тратить время на ее поиск
            obj_friend_confirmation = self.model.objects.get(id=request_id) # извлекаем объект фриенда
            user_confirmation = self.modelUser.objects.get(id=request.user.id) # извлекаем нашу модель юзера
            obj_friend_waiting = self.model.objects.get(object_id=user_waiting, waiting_confirmations=user_confirmation) # извлекаем модель "фриенд" юзера подавшего заявку
            # готовим две формы в которые подставляем уже имеющиеся модели
            form1 = self.modelForm(request.POST, instance=obj_friend_confirmation)
            form2 = self.modelForm(request.POST, instance=obj_friend_waiting)

            if form1.is_valid():
                confirmation_friend = form1.save(commit=False)
                confirmation_friend.friends = obj_user_waiting # у себя переводим из "возможного друга" в "друга"
                confirmation_friend.delete(confirmation_friend.possible_friends) # очищаем прошлое значение
                confirmation_friend.save()
            if form2.is_valid():
                response_request_friend = form2.save(commit=False)
                response_request_friend.friends = user_confirmation # у модели юзера подававшего заявку так же меняем его статус из "ожидающего" на "друг"
                response_request_friend.delete(response_request_friend.waiting_confirmations) # очищаем прошлое значение
                response_request_friend.save()
            logger.info('POST: ObjectConfirmationOfFriendshipMixin, user - {0}'.format(request.user.email))
            return HttpResponse()

# миксин удаления модели дружбы
class ObjectDeleteFriendMixin:
    model = None

    def post(self, request, slug):
        if request.is_ajax():
            pk_my_obj_friend = request.POST.get('pk_my_obj') # получаем айди моей модели "дружбы"
            my_model_friend = self.model.objects.get(pk=pk_my_obj_friend) # забираем объект
            friend_pk = request.POST.get('friend') # получаем айди юзера, который друг
            my_model_friend.delete() # удаляем свою модель
            try:
                friend_model_friend = self.model.objects.get(object_id=friend_pk, friends=request.user) # забираем модель друга
                friend_model_friend.delete() # удаляем
            except self.model.DoesNotExist: # если именно дружбы нет, а все на стадии заявки, то обрабатываем исключение
                friend_model_friend = self.model.objects.get(object_id=friend_pk, waiting_confirmations=request.user)  # и ищем модель где юзер ожидает ответа от нас
                friend_model_friend.delete()  # и удаляем уже ее
            logger.info('POST: ObjectDeleteFriendMixin, user - {0}'.format(request.user.email))
            return HttpResponse()

# миксин приватности страницы с контентом
class ObjectPermissionMixin:
    modelPermission = None
    modelFriend = None

    def post(self, request):
        # все работает через аякс
        # далее получаем отдельно к каждому разделу контента, свои указания от пользователя, чо с ним делать
        slug = request.POST.get('slug')
        txtTypeProfile = request.POST.get('txtTypeProfile')
        txtAudio = request.POST.get('txtAudio') # для примера тут мы получим что делать с моделью аудио, скрыть ее полность или частичто и тп
        audioFriendHid = request.POST.get('audioFriendHid') # тут мы увидим хотим ли мы ограничить некоторых друзей к просмотру контента аудио на моей странице
        txtVideo = request.POST.get('txtVideo')
        videoFriendHid = request.POST.get('videoFriendHid')
        txtPhoto = request.POST.get('txtPhoto')
        photoFriendHid = request.POST.get('photoFriendHid')
        txtGroup = request.POST.get('txtGroup')
        groupFriendHid = request.POST.get('groupFriendHid')
        txtPost = request.POST.get('txtPost')
        postFriendHid = request.POST.get('postFriendHid')
        txtFriends = request.POST.get('txtFriends')
        friendsFriendHid = request.POST.get('friendsFriendHid')

        objFriend = self.modelFriend.objects.filter(slug=slug) # предварительно извлекаем свои модели друзей
        friends = []
        for obj in objFriend:
            if obj.friends != None:
                friends.append(obj.friends.id) # записываем отдельно всех имеющихся друзей

        # так как моделей много и они разные, то выписываем все под отдельную модель
        lenAudio = len(audioFriendHid) # описание работы данного алгоритма было ранее
        arrAudio = []
        x = 0
        while x < lenAudio:
            s_int = ''
            a = audioFriendHid[x]
            while '0' <= a <= '9':
                s_int += a
                x += 1
                if x < lenAudio:
                    a = audioFriendHid[x]
                else:
                    break
            x += 1
            if s_int != '':
                arrAudio.append(int(s_int))

        lenVideo = len(videoFriendHid)
        arrVideo = []
        k = 0
        while k < lenVideo:
            s_int = ''
            a = videoFriendHid[k]
            while '0' <= a <= '9':
                s_int += a
                k += 1
                if k < lenVideo:
                    a = videoFriendHid[k]
                else:
                    break
            k += 1
            if s_int != '':
                arrVideo.append(int(s_int))

        lenPhoto = len(photoFriendHid)
        arrPhoto = []
        e = 0
        while e < lenPhoto:
            s_int = ''
            a = photoFriendHid[e]
            while '0' <= a <= '9':
                s_int += a
                e += 1
                if e < lenPhoto:
                    a = photoFriendHid[e]
                else:
                    break
            e += 1
            if s_int != '':
                arrPhoto.append(int(s_int))

        lenGroup = len(groupFriendHid)
        arrGroup = []
        g = 0
        while g < lenGroup:
            s_int = ''
            a = groupFriendHid[g]
            while '0' <= a <= '9':
                s_int += a
                g += 1
                if g < lenGroup:
                    a = groupFriendHid[g]
                else:
                    break
            g += 1
            if s_int != '':
                arrGroup.append(int(s_int))

        lenPost = len(postFriendHid)
        arrPost = []
        p = 0
        while p < lenPost:
            s_int = ''
            a = postFriendHid[p]
            while '0' <= a <= '9':
                s_int += a
                p += 1
                if p < lenPost:
                    a = postFriendHid[p]
                else:
                    break
            p += 1
            if s_int != '':
                arrPost.append(int(s_int))

        lenFriends = len(friendsFriendHid)
        arrFriends = []
        f = 0
        while f < lenFriends:
            s_int = ''
            a = friendsFriendHid[f]
            while '0' <= a <= '9':
                s_int += a
                f += 1
                if f < lenFriends:
                    a = friendsFriendHid[f]
                else:
                    break
            f += 1
            if s_int != '':
                arrFriends.append(int(s_int))

        # модель ограничения должна быть уникальна, поэтому выполним проверку на ее наличие
        try:
            permission = self.modelPermission.objects.get(slug=slug)
            queryPermission = self.modelPermission.objects.filter(slug=slug) # по мимо объекта модели нам понадобится и ее query set, что бы могли легко и
                                                                            # безпрепятсвенно обновлять ее атрибуты, которые не можем обновить через объект

        except self.modelPermission.DoesNotExist:
            permission = self.modelPermission.objects.create(
                slug=slug,
                user=request.user
            )
            queryPermission = self.modelPermission.objects.filter(slug=permission.slug)

        # самый простое и самое массое ограничение это ограничение всего контаента
        if txtTypeProfile == 'Открытый': # сверяем полученные данные от пользователя
            permission.all.clear() # если страница будет открытой в атрибуте должно быть пусто
            permission.txtAll = 'Открытый'
        elif txtTypeProfile == 'Закрытый':
            permission.all.clear()
            permission.all.add(request.user) # если закрытой то добавим только себя, что бы проще было делать сверку на показ в шаблоне

        # далее описание ограничений под различный контент похожи, отличает их только нейминг атрибутов
        # принцип DRY тут применить проблематично, так как тогда потеряется уникальность конкретной области ограничения контента
        # поэтому описываем каждый тип ограничения отдельно
        if txtAudio == 'Видно всем':
            permission.audio.clear() # если мы хотим открыть для всех, то юзеров в атрибуте быть не должно
            permission.audioHidFriend.clear() # так же очистим и список отдельных друзей, мы же хотим сделать видимость для всех
            queryPermission.update(txtAudio='Видно всем') # обновляем статус текущего ограничения, что бы потом корректно подгружать его в настройках профиля
        elif txtAudio == 'Скрыть от всех':
            permission.audio.clear()
            queryPermission.update(txtAudio='Скрыть от всех')
            permission.audio.add(request.user) # если скрываем от всех, то добовляем только себя
        elif txtAudio == 'Видно только друзьям':
            queryPermission.update(txtAudio='Видно только друзьям')
            permission.audio.clear()
            # для того что бы наложить ограничения на всех кроме друзей нам и нужны были наши квери сеты моделей друзей
            # из которых мы благополучно извлекли айпи юзеров, которым и предоставим доступ к просмотру в шаблоне
            for friend in friends:
                permission.audio.add(friend) # тут все просто, методом перебора по одному добавляем их в наш список
        elif txtAudio == 'Скрыть от некоторых друзей':
            arr = []
            # если мы хотим скрыть от некоторых друзей и например у нас стоит видимость только для друзей, то нам нужно
            # убрать видимость для тех друзей кому доступ запрещен
            for friend in permission.audioHidFriend.all(): # извлекаем всех текущий друзей
                arr.append(friend.id)
            result = list(set(arrAudio) - set(arr)) # проверяем их принадлежность на дружбу и извлекаем тех которые должны быть исключены
            for friend in result:
                permission.audioHidFriend.add(friend) # добовляем друзей которых надо исключить в отдельный атрибут
            queryPermission.update(txtHidAudio='Скрыть от некоторых друзей')
        elif txtAudio == '' and len(arrAudio) != 0: # если мы хотим открыть доступ для одного из ранее попавших под ограничения друзей
            for friend in arrAudio:
                permission.audioHidFriend.remove(friend) # мы просто удаляем его из списка

        # с остальными ограничением коонтента все тоже самое
        if txtVideo == 'Видно всем':
            permission.video.clear()
            permission.videoHidFriend.clear()
            queryPermission.update(txtVideo='Видно всем')
        elif txtVideo == 'Скрыть от всех':
            permission.video.clear()
            queryPermission.update(txtVideo='Скрыть от всех')
            permission.video.add(request.user)
        elif txtVideo == 'Видно только друзьям':
            queryPermission.update(txtVideo='Видно только друзьям')
            permission.video.clear()
            for friend in friends:
                permission.video.add(friend)
        elif txtVideo == 'Скрыть от некоторых друзей':
            arr = []
            for friend in permission.videoHidFriend.all():
                arr.append(friend.id)
            result = list(set(arrVideo) - set(arr))
            for friend in result:
                permission.videoHidFriend.add(friend)
            queryPermission.update(txtHidVideo='Скрыть от некоторых друзей')
        elif txtVideo == '' and len(arrVideo) != 0:
            for friend in arrVideo:
                permission.videoHidFriend.remove(friend)

        if txtPhoto == 'Видно всем':
            permission.photo.clear()
            permission.photoHidFriend.clear()
            permission.txtPhoto = 'Видно всем'
        elif txtPhoto == 'Скрыть от всех':
            permission.photo.clear()
            queryPermission.update(txtPhoto='Скрыть от всех')
            permission.photo.add(request.user)
        elif txtPhoto == 'Видно только друзьям':
            queryPermission.update(txtPhoto='Видно только друзьям')
            permission.photo.clear()
            for friend in friends:
                permission.photo.add(friend)
        elif txtPhoto == 'Скрыть от некоторых друзей':
            arr = []
            for friend in permission.photoHidFriend.all():
                arr.append(friend.id)
            result = list(set(arrPhoto) - set(arr))
            for friend in result:
                permission.photoHidFriend.add(friend)
            queryPermission.update(txtHidPhoto='Скрыть от некоторых друзей')
        elif txtPhoto == '' and len(arrPhoto) != 0:
            for friend in arrPhoto:
                permission.photoHidFriend.remove(friend)

        if txtGroup == 'Видно всем':
            permission.group.clear()
            permission.groupHidFriend.clear()
            queryPermission.update(txtGroup='Видно всем')
        elif txtGroup == 'Скрыть от всех':
            permission.group.clear()
            queryPermission.update(txtGroup='Скрыть от всех')
            permission.group.add(request.user)
        elif txtGroup == 'Видно только друзьям':
            queryPermission.update(txtGroup='Видно только друзьям')
            permission.group.clear()
            for friend in friends:
                permission.group.add(friend)
        elif txtGroup == 'Скрыть от некоторых друзей':
            arr = []
            for friend in permission.groupHidFriend.all():
                arr.append(friend.id)
            result = list(set(arrGroup) - set(arr))
            for friend in result:
                permission.groupHidFriend.add(friend)
            queryPermission.update(txtHidGroup='Скрыть от некоторых друзей')
        elif txtGroup == '' and len(arrGroup) != 0:
            for friend in arrGroup:
                permission.groupHidFriend.remove(friend)

        if txtPost == 'Видно всем':
            permission.post.clear()
            permission.postHidFriend.clear()
            queryPermission.update(txtPost='Видно всем')
        elif txtPost == 'Скрыть от всех':
            permission.post.clear()
            queryPermission.update(txtPost='Скрыть от всех')
            permission.post.add(request.user)
        elif txtPost == 'Видно только друзьям':
            queryPermission.update(txtPost='Видно только друзьям')
            permission.post.clear()
            for friend in friends:
                permission.post.add(friend)
        elif txtPost == 'Скрыть от некоторых друзей':
            arr = []
            for friend in permission.postHidFriend.all():
                arr.append(friend.id)
            result = list(set(arrPost) - set(arr))
            for friend in result:
                permission.postHidFriend.add(friend)
            queryPermission.update(txtHidPost='Скрыть от некоторых друзей')
        elif txtPost == '' and len(arrPost) != 0:
            for friend in arrPost:
                permission.postHidFriend.remove(friend)

        if txtFriends == 'Видно всем':
            permission.friend.clear()
            permission.friendHidFriend.clear()
            queryPermission.update(txtFriend='Видно всем')
        elif txtFriends == 'Скрыть от всех':
            permission.friend.clear()
            queryPermission.update(txtFriend='Скрыть от всех')
            permission.friend.add(request.user)
        elif txtFriends == 'Видно только друзьям':
            queryPermission.update(txtFriend='Видно только друзьям')
            permission.friend.clear()
            for friend in friends:
                permission.friend.add(friend)
        elif txtFriends == 'Скрыть от некоторых друзей':
            arr = []
            for friend in permission.friendHidFriend.all():
                arr.append(friend.id)
            result = list(set(arrFriends) - set(arr))
            for friend in result:
                permission.friendHidFriend.add(friend)
            queryPermission.update(txtHidFriend='Скрыть от некоторых друзей')
        elif txtFriends == '' and len(arrFriends) != 0:
            for friend in arrFriends:
                permission.friendHidFriend.remove(friend)

        logger.info('POST: ObjectPermissionMixin, user - {0}'.format(request.user.email))
        return HttpResponse()

# миксин по поиску объектов
class ObjectSearchMixin(APIView):
    modelObj = None
    serializer_class_Obj = None
    modelPerson = None
    serializer_class_Person = None

    def get(self, request):
        q = get_q(self.request) # забираем поисковый запрос
        num_tab = get_num_tab(self.request) # ключ, от которого зависит область поиска
        user = request.GET.get('user') # айди юзера

        data = None
        user = self.modelPerson.objects.get(id=user)

        # так как поисковые запросы по группе отличаются от поиска среди других моделей
        # мы будем их разделять путем ловли исключения, которое будет вызвано из-за различия в нейминге методов поиска
        try:
            if num_tab == '1' or num_tab == '2':
                obj = self.modelObj.objects.search(object_id=user.id, query=q)
                serializerObj = self.serializer_class_Obj(obj, many=True)
                data = serializerObj.data
            elif num_tab == '3':
                try: # данное условие так же основано на ловле исключения из-за различного нейминга
                    Person = self.modelPerson.objects.search(query=q)
                    serializerPerson = self.serializer_class_Person(Person, many=True)
                    data = serializerPerson.data
                except:
                    obj = self.modelObj.objects.searchGlobal(query=q)
                    serializerObj = self.serializer_class_Obj(obj, many=True)
                    data = serializerObj.data
        except:
            if num_tab == '1': # модели групп мы ищем либо по подписке на них
                obj = self.modelObj.objects.searchFollowers(followers=user, query=q)
                serializerObj = self.serializer_class_Obj(obj, many=True)
                data = serializerObj.data
            elif num_tab == '2': # либо среди всех групп
                obj = self.modelObj.objects.searchGroupAll(query=q)
                serializerObj = self.serializer_class_Obj(obj, many=True)
                data = serializerObj.data
            elif num_tab == '3': # либо среди тех, которые мы сосздали сами
                obj = self.modelObj.objects.searchUser(user=user, query=q)
                serializerObj = self.serializer_class_Obj(obj, many=True)
                data = serializerObj.data

        logger.info('GET: ObjectSearchMixin, user - {0}'.format(request.user.email))
        return Response(data)

# данный метод можно назвать компьютерным зрением, он позволяет нам определять цвета обложки альбома,
# основываясь на размещение точек по периметру обложки альбома, можем устанавливать различное количество
# получаемых цветов на выходе и так же увеличивать площать поиска, но все это скажется
# на производительности
class ObjectBackColorMixin:

    def post(self, request):
        src = request.POST.get('src') # получаем адрес хранения медиа файла в нашем каталоге проекта

        # но этого не достаточно, так как данный алгоритм не знает, что он в проекте ему нужно указать полный адрес нахождения файла начиная с корневого каталога
        img = '/webapps/Social-Network/Social-Network-project/' + src

        # создаем наследуем класс кортежа, с именованными полями, благодаря подлючаемому модулю namedtuple
        Point = namedtuple('Point', ('coords', 'n', 'ct'))  # один с координатами точек разбросанных по обложке альбома
        Cluster = namedtuple('Cluster', ('points', 'center', 'n')) # другой с полученными данными от этих точек

        def get_points(img):
            points = []
            w, h = img.size
            for count, color in img.getcolors(w * h): # используем метод getcolors для преобразования наших точек в RGB значение исходя из заданных координат
                points.append(Point(color, 3, count)) # записываем их массив который будет состоять из кортежей с полученными тремя цветами
            return points

        rtoh = lambda rgb: '#%s' % ''.join(('%02x' % p for p in rgb)) # метод преобразования ниших RGB цветов в Hex

        def colorz(filename, n=2): # задаем количество цветов, которые нам нужны на выходе, чем больше тем дольше процесс вычесления
            img = Image.open(filename) # открываем наше изображение с альбомом, через метод библеотеки PIL
            img.thumbnail((200, 200)) # задаем прощадь опредения цвета, опять же чем шире площадь тем дольше вычесления
            w, h = img.size # указываем высоту и ширину, исходя из пиксельных расмеров изображения

            points = get_points(img) # передаем наше изображение в ранее объявленный метод для начала сбора данных с распределнных точек
            clusters = kmeans(points, n, 1) # объеденям полученные данные для вычесления среднего значения
            rgbs = [map(int, c.center.coords) for c in clusters] # составляем политру в формате RGB
            return list(map(rtoh, rgbs)) # возвращаем в значении Hex

        def euclidean(p1, p2): # метод расчета дистанции между точками
            return sqrt(sum([
                (p1.coords[i] - p2.coords[i]) ** 2 for i in range(p1.n)
            ]))

        def calculate_center(points, n): # метод распределения точек
            vals = [0.0 for i in range(n)]
            plen = 0
            for p in points:
                plen += p.ct
                for i in range(n):
                    vals[i] += (p.coords[i] * p.ct)
            return Point([(v / plen) for v in vals], n, 1)

        def kmeans(points, k, min_diff): # метод вычеследния среднего значения цвета исходя из поленных данных
            clusters = [Cluster([p], p, p.n) for p in random.sample(points, k)]

            while 1:
                plists = [[] for i in range(k)]

                for p in points:
                    smallest_distance = float('Inf')
                    for i in range(k):
                        distance = euclidean(p, clusters[i].center)
                        if distance < smallest_distance:
                            smallest_distance = distance
                            idx = i
                    plists[idx].append(p)

                diff = 0
                for i in range(k):
                    old = clusters[i]
                    center = calculate_center(plists[i], old.n)
                    new = Cluster(plists[i], center, old.n)
                    clusters[i] = new
                    diff = max(diff, euclidean(old.center, new.center))

                if diff < min_diff:
                    break

            return clusters

        arr = colorz(img) # переводим полученные значения в переменную
        colors = {'colors': arr} # и погружаем их в словать, что бы можно было его передать в качестве json объекта

        logger.info('POST: ObjectBackColorMixin, user - {0}'.format(request.user.email))
        return HttpResponse(
            json.dumps({
                'colors': colors
            }),
            content_type='application/json'
        )

# метод вывода списка групп
class ObjectGroupsList:
    modelGroup = None
    modelGroupForm = None
    modelPerson = None
    modelChat = None
    template = None

    def get(self, request, slug):
        ctx = {}

        person = self.modelPerson.objects.get(slug=slug)
        ctx['person'] = person
        ctx['followGroups'] = self.modelGroup.objects.filter(followers=person)
        ctx['personGroups'] = self.modelGroup.objects.filter(user=person)
        ctx['allGroups'] = self.modelGroup.objects.all()
        ctx['formGroup'] = self.modelGroupForm
        ctx['chats'] = self.modelChat.objects.filter(members__in=[request.user.id]).filter(type=self.modelChat.CHAT)
        logger.info('GET: ObjectGroupsList, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# метод вывода данных конкретной группы
class ObjectGroupDetail:
    modelGroup = None
    modelPerson = None
    modelChat = None
    template = None

    def get(self, request, slug):
        ctx = {}

        ctx['group'] = self.modelGroup.objects.get(slug=slug)
        ctx['chats'] = self.modelChat.objects.filter(members__in=[request.user.id]).filter(type=self.modelChat.CHAT)
        logger.info('GET: ObjectGroupDetail, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# метод оформления или отказа от подписки на группу
class GroupFollowersChangeMixin(APIView):
    modelGroup = None
    serializerGroup = None

    def get(self, request):
        pk = request.GET.get('pk') # забираем айди группы
        key = request.GET.get('key') # забираем ключ

        group = self.modelGroup.objects.get(pk=pk)
        # исходя из значения ключа выполняем либо подписку либо отписку от группы
        if key == '1':
            group.followers.add(request.user)
        elif key == '2':
            group.followers.remove(request.user)

        qs = self.modelGroup.objects.filter(pk=pk)
        followers = self.serializerGroup(qs, many=True) # полученные данные сериализуем для дальнейшем работы с ними в шаблоне
        logger.info('GET: GroupFollowersChangeMixin, user - {0}'.format(request.user.email))
        return Response(followers.data)

# метод вывода новостной ленты, в которой мы будем отображать медиа файлы пользователей и групп на которые "я" как пользователь подписан
# так и их посты и все это с учетом ограничения на показ контента от пользователя на которого мы подписаны как друзья
class ObjectNewsFeed:
    modelPhoto = None
    modelAudio = None
    modelVideo = None
    modelPost = None
    modelGroup = None
    modelPerson = None
    modelContentType = None
    modelFriend = None
    modelPermission = None
    template = None

    def get(self, request, slug):
        ctx = {}

        query_set = [] # так как модели новостной летны мы не создавали и она в принципе не требуется, объеденять все модели будем в один query set

        person = self.modelPerson.objects.get(slug=slug) # заберем наш объект юзера, что бы сверять органичения на показ контента
        content_type = self.modelContentType.objects.get_for_model(person)
        friends = self.modelFriend.objects.filter(friends=person) # забираем все модели "дружбы" где "я" как пользователь друг

        for user in friends: # выгружаем методом перебора все объекты пользователей. являющихся друзьями
            friend = self.modelPerson.objects.get(id=user.object_id)

            # собираем с них интересующий нас контент, который будем выводить в ленту
            photo = self.modelPhoto.objects.filter(object_id=user.object_id).filter(content_type=content_type)
            audio = self.modelAudio.objects.filter(object_id=user.object_id).filter(content_type=content_type)
            video = self.modelVideo.objects.filter(object_id=user.object_id).filter(content_type=content_type)
            post = self.modelPost.objects.filter(object_id=user.object_id).filter(content_type=content_type)


            permissions = self.modelPermission.objects.filter(user=friend) # выгружаем модель ограничения нашего друга
            if permissions.all().count() != 0: # если она есть выполняем проверку нас как юзера к контенту
                for permission in permissions:
                    if permission.all.all().count() == 0:

                        if permission.photo.all().count() == 0 and person not in permission.photoHidFriend.all():
                            query_set.append(photo)
                        elif person in permission.photo.all() and person not in permission.photoHidFriend.all():
                            query_set.append(photo)

                        if permission.audio.all().count() == 0 and person not in permission.audioHidFriend.all():
                            query_set.append(audio)
                        elif person in permission.audio.all() and person not in permission.audioHidFriend.all():
                            query_set.append(audio)

                        if permission.video.all().count() == 0 and person not in permission.videoHidFriend.all():
                            query_set.append(video)
                        elif person in permission.video.all() and person not in permission.videoHidFriend.all():
                            query_set.append(video)

                        if permission.post.all().count() == 0 and person not in permission.postHidFriend.all():
                            query_set.append(post)
                        elif person in permission.post.all() and person not in permission.postHidFriend.all():
                            query_set.append(post)

                    else: pass
            else: # если модели ограничения нет то безпрепятственно погружаем контент в общий query set
                query_set.append(photo)
                query_set.append(audio)
                query_set.append(video)
                query_set.append(post)

        # для групп ситуация схожая, но так как ограничения на пока контента у нее пока нет
        # мы забираем все ее посты, медиа файлы нас не интересуют
        groups = self.modelGroup.objects.filter(followers=person)
        for group in groups:
            try: # если мы не подписаны не на одну группу, то пропускаем этот тип контента
                objGroup = self.modelGroup.objects.get(id=group.id)
                content_type_group = self.modelContentType.objects.get_for_model(objGroup)
                query_set.append(self.modelPost.objects.filter(object_id=group.id).filter(content_type=content_type_group))
            except:
                pass

        final_set = list(chain(*query_set))
        final_set.sort(key=lambda x: x.date_pub, reverse=True) # отсортировавыем весь контент под дате публикации и начинаем показ с новый

        ctx['news'] = final_set
        logger.info('GET: ObjectNewsFeed, user - {0}'.format(request.user.email))
        return render(request, self.template, ctx)

# далее у нас описаны методы вывода данных через сериализацию моделей, в целом они похожи отличаются только параметры фильтрации искомых данных
# метод вывода количества непрочитанных сообщений
class ObjectUnreadMessage(APIView):
    modelChat = None
    modelSerializer = None

    def get(self, request):
        # отфильтровываем чаты в которых у нас есть непрочитанные сообщения написанные не нами
        qs = self.modelChat.objects.filter(members__id=request.user.id).filter(last_message__is_read=False).exclude(last_message__isnull=True).exclude(last_message__author=request.user)
        chats = self.modelSerializer(qs, many=True)
        logger.info('GET: ObjectUnreadMessage, user - {0}'.format(request.user.email))
        return Response(chats.data)

# метод вывода количества заявок на дружбу
class ObjectPossibleFriends(APIView):
    modelFriend = None
    modelSerializer = None

    def get(self, request):
        qs = self.modelFriend.objects.filter(object_id=request.user.id).filter(friends=None).filter(waiting_confirmations=None)
        friends = self.modelSerializer(qs, many=True)
        logger.info('GET: ObjectPossibleFriends, user - {0}'.format(request.user.email))
        return Response(friends.data)

# метод получения отправленого нами как юзером сообщения
class ObjectRequestMessageUser(APIView):
    modelChat = None
    modelSerializer = None

    def get(self, request):
        chat_id = request.GET.get('chat_id')
        chat = self.modelChat.objects.filter(id=chat_id)
        message = self.modelSerializer(chat, many=True)
        logger.info('GET: ObjectRequestMessageUser, user - {0}'.format(request.user.email))
        return Response(message.data)

# метод получения сообщений адресованных нам
class ObjectRequestMessageFriend(APIView):
    modelChat = None
    modelSerializer = None

    def get(self, request):
        chat_id = request.GET.get('chat_id')
        objChat = self.modelChat.objects.get(id=chat_id)
        chat = self.modelChat.objects.filter(id=chat_id)
        if objChat.last_message: # так как метод на потоке, то проверяем было ли нам адресовано сообщение в последние три секунды
            if (timezone.now() - objChat.last_message.date_pub) < timezone.timedelta(seconds=3) and objChat.last_message.author != request.user:
                objChat.message_set.filter(is_read=False).exclude(author=request.user).update(is_read=True)
                message = self.modelSerializer(chat, many=True)
                logger.info('GET: ObjectRequestMessageFriend, user - {0}'.format(request.user.email))
                return Response(message.data) # если да выводим его
            else:
                logger.info('GET: ObjectRequestMessageFriend, user - {0}'.format(request.user.email))
                return Response() # если нет то ничего не отпралвялем соответственно
        else: # если же в чате было удалено последнее сообщение и нового не поступало, то мы так же ничего не отправляем
            logger.info('GET: ObjectRequestMessageFriend, user - {0}'.format(request.user.email))
            return Response()

# метод на запрос данных об аватаре
class ObjectRequestAvatar(APIView):
    modelAlbum = None
    modelSerializer = None

    def get(self, request):
        slug = request.GET.get('slug')
        photo = self.modelAlbum.objects.filter(slug=slug).filter(descriptionAlbum='Аватар')
        avatar = self.modelSerializer(photo, many=True)
        logger.info('GET: ObjectRequestAvatar, user - {0}'.format(request.user.email))
        return Response(avatar.data)

# метод вывода созданного нами комментария
class ObjectRequestCommentPhoto(APIView):
    modelObj = None
    modelComment = None
    modelContentType = None
    modelSerializer = None

    def get(self, request):
        obj_id = request.GET.get('obj_id')
        obj = get_object_or_404(self.modelObj, id=obj_id)
        content_type = self.modelContentType.objects.get_for_model(obj)
        # важно забрать именно последний написанный нами комментарий и что бы он был в query set
        comments = self.modelComment.objects.filter(object_id=obj.id).filter(content_type=content_type).filter(user=request.user).reverse()[:1]
        obj_comment = self.modelSerializer(comments, many=True)
        logger.info('GET: ObjectRequestCommentPhoto, user - {0}'.format(request.user.email))
        return Response(obj_comment.data)

# метод вывода написанных постов
class ObjectRequestPost(APIView):
    modelPost = None
    modelSerializer = None

    def get(self, request):
        postObj = self.modelPost.objects.filter(user=request.user)[:1] # так как посты из БД подтягивают от нового к старым, то просто забираем последний написанный нами
        post = self.modelSerializer(postObj, many=True)
        logger.info('GET: ObjectRequestPost, user - {0}'.format(request.user.email))
        return Response(post.data)

