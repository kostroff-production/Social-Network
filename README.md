# Social-Network
### О проекте
Проект представляет из себя площадку для коммуникации пользователей между собой.<br>
Социальная сеть имеет набор привычных опций, создание постов, загрузка своего контента, будь то аудио, видео или фото файлы.
<br>
<br>
![alt text](screenshots/добавление_фото.png)
<br>
<br>
![alt text](screenshots/галлерея.jpg) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ![alt text](screenshots/пост.jpg) 
<br>
<br>
Любой пользователь может создать диалог с интересующим его человеком. Система проверит была ли ранее беседа с этим пользователем и переведет на диалог.
<br>
<br>
![alt text](screenshots/чат.jpg)
<br>
<br>
В разделе аудио реализована смена цветовой гаммы заднего фона в зависимости от обожки альбома.
<br>
<br>
![alt text](screenshots/аудио1.jpg) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ![alt text](screenshots/аудио2.jpg) 
<br>
<br>
Под каждым объектом с контентом есть стандартный набор кнопок, это оставить голос, либо комментарий или поделиться.<br>
Если пользователя заинтересует медиаконтент другого юзера, он может его добавить в свою медиатеку.
<br>
<br>
![alt text](screenshots/like_comment.jpg)
<br>
<br>
У каждого пользователя формируется своя новостная лента с контентом, в зависимости от людей на которых он подписан и сообществ в которых он состоит. Любой пользователь может ограничивать доступ к просмотру своего контента в настройках профиля.
### API
Практически 80% запросов к базе данных происходит без перезагрузки страницы, что ускоряет ответ от сервера и улучшает восприятие сайта.
В этом мне помог фреймоврк `Django Rest Framework`.
Для примера продемострирую фрагмент кода, который решает проеблему подгрузки последнего созданного сообщения пользователем:<br>
```python
    def get(self, request):
        chat_id = request.GET.get('chat_id')
        chat = self.modelChat.objects.filter(id=chat_id)
        message = self.modelSerializer(chat, many=True)
        logger.info('GET: ObjectRequestMessageUser, user - {0}'.format(request.user.email))
        return Response(message.data)
```
<br>
Полученные данные обрабатываем в шаблоне. Фреймовр сильно помогает формируя API и ускоряя процесс разработки.<br>
Установка и документация описана на сайте:

[django-rest-framework.org](https://www.django-rest-framework.org/)

### Emoji
Какой чат без эмоджи? В любой беседе мы так или иначе их используем.<br>
В проект были интегрированы эмоджи из репозитория: [emoji-mart](https://github.com/missive/emoji-mart) <br>
После чего они были адаптированы под мой проект. Если пользователь находится на сайте через браузер ПК или мобильного устройства, 
он может воспользоваться ими в любом месте, где требуется отправить какое либо сообщение. 
<br>
<br>
#### Пример в чате с ПК:

![alt text](screenshots/эмоджи_пк.png) 

#### Пример в комментариях с мобильного устройства:

![alt text](screenshots/эмоджи_мб.jpg) 

### Install Ubuntu Server
Установить проект возможно на любом VPS или Server хостинге.<br>
Ссылкы на вытягивание или скачивание проекта из репозитория доступны во вкладке `code`:
<br>
![alt text](screenshots/гит.jpg) 
<br>
#### Docker
Поднимать проект будем через платформу docker, для этого необходимо подключиться к машине 
и установить ряд пакетов и утилит, в том числе и сам docker.
<br>
```
 sudo apt update
 sudo apt install apt-transport-https ca-certificates curl software-properties-common
 curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
 sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
 sudo apt update
 apt-cache policy docker-ce
 sudo apt install docker-ce
 sudo systemctl status docker
 sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
 sudo chmod +x /usr/local/bin/docker-compose
```
<br>
Следующим этапом будет создание директории под проект и вытягивание его с git.
```
 mkdir django-on-docker && cd django-on-docker
 apt install git
 git clone https://github.com/Kostrov-Producsion/Social-Network.git
```
<br>
В моем случае папка nginx с файлами установки и настройки находится в директории проекта. 
Вы можете ее перенести куда Вам будет более удобно, но тогда необходимо будет изменить адрес в файле docker-compose.yml в строке -
```
nginx:
    build: ваш адрес
```
<br>
Далее отправляем команду на постройку проекта, все зависимости и алгоритм построения слоев описан в файлах docker-compose.yml и Dockerfile,
в директории nginx.
```
docker-compose up -d --build
```
<br>
В настоящий момент проект развернут на хостинге и доступен по адресу:

[kostrov-production.ru](http://kostrov-production.ru/)
