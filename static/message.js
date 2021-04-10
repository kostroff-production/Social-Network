var innerMessage = document.getElementById('innerMessages');
    innerMessage.addEventListener('click', edit);
    innerMessage.addEventListener('click', DeleteMessage);
var input_div = document.getElementById('message_id div');
    input_div.addEventListener('keyup', CreateMessage);
var btn_form = document.getElementById('btn-message-form');
    btn_form.addEventListener('click', CreateMessage);
var blockMedia = document.querySelector('.list-media-file');

window.onload = ScrollDownPage(); // пролистываем список сообщений до последнего при загрузке страницы
function ScrollDownPage() {
    var innerMessages = document.getElementById('innerMessages');
   innerMessages.scrollTo({
        top: innerMessages.scrollHeight,
        behavior: "smooth"
    });
}

document.addEventListener('click', function (event) { // меняем подцветку инпута при фокусировке
   var target = event.target;
   var message_form = document.getElementById('message-form');
   if (target === input_div) {
       message_form.setAttribute('style', 'box-shadow: 0 0 25px #666666; transition: 0.5s;');
   } else {
       message_form.removeAttribute('style');
   }
});

// функция создания сообщения
function CreateMessage(event) {
    if (input_div.hasAttribute('data-message-slug') === false) { // проверяем наличие атрибута "обновление сообщения"
        var target = event.target;
        var data_id = document.getElementById('innerMessages');
        var data_chat_id = data_id.getAttribute('data-chat_id');
        var btnCancel = blockMedia.querySelectorAll('.bi.bi-x');
        if (btnCancel) { // удаляем кнопку "удаления" из блока с вложенными медиа файлами
            for (var i = 0; i < btnCancel.length; i++) {
                btnCancel[i].remove();
            }
        }
        var photo = blockMedia.querySelectorAll('.photo-file.create-file');
        if (photo) { // меняем имя класса для фото файлов, что бы подключились необходимые стили
            for (var e = 0; e < photo.length; e++) {
                photo[e].classList.remove('photo-file');
                photo[e].classList.remove('create-file');
                photo[e].classList.add('gallery-item');
                photo[e].classList.add('re-post');
            }
        }
        // очищаем текст сообщения от пробелов и добавляем содержимое блока с медиа файлами
        var str = input_div.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim() + blockMedia.innerHTML;
        if (str !== '') { // проверяем, что бы инпут был не пустой
            if (target.parentElement.id === "message-form" && event.keyCode === 13) { // отправляем сообщение если нажат enter
                $.ajax({
                    url: '/dialogs/' + data_chat_id + '/',
                    type: 'POST',
                    data: {
                        message: str,
                    },
                    success: function () {
                        input_div.innerHTML = '';
                        blockMedia.innerHTML = '';
                        RequestMessageUser(); // активируем функцию добавления нового сообщения в пулл сообщений
                    },
                });
            }

            if (target.parentElement.id === "btn-message-form") { // отправляем сообщение если нажата кнопка "отправки"
                $.ajax({
                    url: '/dialogs/' + data_chat_id + '/',
                    type: 'POST',
                    data: {
                        message: str,
                    },
                    success: function () {
                        input_div.innerHTML = '';
                        blockMedia.innerHTML = '';
                        target.blur();
                        RequestMessageUser();
                    },
                });
            }
        }else {
            input_div.innerHTML = '';
            target.blur(); // если инупс пуст и мы пытемся отправить сообщение, то таргет сбрасывается
        }
    }
}    

// функция подготовки сообщения к обновлению
function edit(event) {
    var targ = event.target.closest('.edit-message');
    if (targ) {
        var message = event.target.closest('.message-box-user');
        var data_id = message.getAttribute('data-message-id');
        var message_id = document.getElementById(data_id);
        var btnSave = document.getElementById('btnSave');
        var slug = message.getAttribute('data-message-slug');
        var data_chat_id = message.getAttribute('data-chat-id');
        input_div.innerHTML = message_id.innerHTML + '&nbsp';
        input_div.setAttribute('data-message-id', data_id);
        input_div.setAttribute('data-message-slug', slug);
        input_div.setAttribute('data-chat-id', data_chat_id);
        input_div.setAttribute('data-old-message', message_id.innerHTML);
        btnSave.addEventListener('click', UpdateMessage);
        input_div.addEventListener('keyup', UpdateMessage);
        input_div.focus();
        var select = window.getSelection();
        select.selectAllChildren(input_div);
        select.collapseToEnd();
        hidePen();
    }
}

// функция обновления сообщения
function UpdateMessage(event) { // работа функции схожа с функцией создания сообщения
    if (input_div.hasAttribute('data-message-slug')) {
        var target = event.target;
        var data_chat_id = input_div.getAttribute('data-chat-id');
        var slug = input_div.getAttribute('data-message-slug');
        var data_id = input_div.getAttribute('data-message-id');
        var oldMessage = input_div.getAttribute('data-old-message');
        var message_id = document.getElementById(data_id);
        var btnCancel = blockMedia.querySelectorAll('.bi.bi-x');
        if (btnCancel) {
            for (var i = 0; i < btnCancel.length; i++) {
                btnCancel[i].remove();
            }
        }
        var photo = blockMedia.querySelectorAll('.photo-file.create-file');
        if (photo) {
            for (var e = 0; e < photo.length; e++) {
                photo[e].classList.remove('photo-file');
                photo[e].classList.remove('create-file');
                photo[e].classList.add('gallery-item');
                photo[e].classList.add('re-post');
            }
        }
        var str = input_div.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim() + blockMedia.innerHTML;
        if (str !== '') {
            if (target.parentElement.id === "message-form" && event.keyCode === 13) {
                $.ajax({
                    url: '/dialogs/' + data_chat_id + '/updateMessage/',
                    type: 'POST',
                    data: {
                        slug_message: slug,
                        message: str,
                        old_message: oldMessage
                    },
                    success: function () {
                        hideSave();
                        message_id.innerHTML = str;
                        input_div.innerHTML = '';
                        blockMedia.innerHTML = '';
                        // только в конце удаляем атрибуты указывающие, что происходит обновление
                        input_div.removeAttribute('data-chat-id');
                        input_div.removeAttribute('data-message-slug');
                        input_div.removeAttribute('data-message-id');
                    }
                });
            }

            if (target.parentElement.id === "btnSave") {
                $.ajax({
                    url: '/dialogs/' + data_chat_id + '/updateMessage/',
                    type: 'POST',
                    data: {
                        slug_message: slug,
                        message: str,
                        old_message: oldMessage
                    },
                    success: function () {
                        hideSave();
                        message_id.innerHTML = str;
                        input_div.innerHTML = '';
                        blockMedia.innerHTML = '';
                        input_div.removeAttribute('data-chat-id');
                        input_div.removeAttribute('data-message-slug');
                        input_div.removeAttribute('data-message-id');
                        target.blur();
                    }
                });
            }
        }else {
            hideSave();
            input_div.innerHTML = '';
            blockMedia.innerHTML = '';
            input_div.removeAttribute('data-chat-id');
            input_div.removeAttribute('data-message-slug');
            input_div.removeAttribute('data-message-id');
            target.blur();
        }
    }
}

// функция удаления сообщения
function DeleteMessage(event) {
    var targ = event.target.closest('.btn-delete-message');
    if (targ) {
        var message = event.target.closest('.message-box-user');
        var slug = message.getAttribute('data-message-slug');
        var data_chat_id = message.getAttribute('data-chat-id');
        $.ajax({
            url: '/dialogs/' + data_chat_id + '/deleteMessage/',
            type: 'POST',
            data: {
                slug_message: slug
            },
            success: function () {
                message.style.display = 'none'; // после удаления, сообщение скрываем в пулле
            }
        });
    }
}

// функции анимирования кнопок

function hidePen() {
    $('#btn-message-form').fadeOut(1000);
    setTimeout(function () {
        $('#btnSave').fadeIn(1000);
    }, 1000);
}

$('#btnSave').click(hideSave());

function hideSave () {
   $('#btnSave').fadeOut(1000);
   setTimeout(function () {
       $('#btn-message-form').fadeIn(1000);
   }, 1000);
}

// устанавливаем положение всплывающих меню

var add_file = document.getElementById('add-file');
var drop_menu_add = document.getElementById('drop-menu-add-file');
drop_menu_add.style.top = add_file.offsetTop - 180 + 'px';
drop_menu_add.style.left = add_file.offsetLeft - 100 + 'px';

var PhotoBox = document.querySelector('.add-photo');
var AudioBox = document.querySelector('.add-audio');
var VideoBox = document.querySelector('.add-video');

PhotoBox.style.top = add_file.offsetTop - 410 + 'px';
PhotoBox.style.left = add_file.offsetLeft - 200 + 'px';

AudioBox.style.top = add_file.offsetTop - 410 + 'px';
AudioBox.style.left = add_file.offsetLeft - 200 + 'px';

VideoBox.style.top = add_file.offsetTop - 410 + 'px';
VideoBox.style.left = add_file.offsetLeft - 200 + 'px';

window.addEventListener('click', function (event) { // активируем меню по клику
   if (event.target.closest('.add-file')) {
       toggleAddMenu();
   } else {
       hideAddMenu();
   }
});

// функции анимирования показа меню

var menu_drop = $('#drop-menu-add-file');
function toggleAddMenu() {
    menu_drop.fadeToggle(500);
}

function hideAddMenu() {
    menu_drop.fadeOut(500);
}

document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('click', function () {
        if (innerMessage.offsetWidth > 420) {
            item.classList.toggle('full');
            var image = item.querySelector('img');
            var body = document.body;
            image.style.top = (body.offsetHeight - image.offsetHeight) + 'px';
            image.style.left = (body.offsetWidth - image.offsetWidth) / 2 + 'px';
        }
    });
});

var message_box_user = document.getElementById('message-box-user');

// функция добавления сообщения в пулл
function RequestMessageUser() {
    var user = message_box_user.getAttribute('data-user');
    var mouth = {'01': 'января', '02': 'февраля', '03': 'марта',
        '04': 'апреля', '05': 'мая', '06': 'июня', '07': 'июля',
        '08': 'августа', '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'};
    $.ajax({
       url: '/requestMessage/User/',
       type: 'GET',
       data: {
           chat_id: message_box_user.getAttribute('data-chat-id') // передаем айди чата
        },
        success: function (data) {
           var clone;
           var date;
           var date_uts;
           var p;
           if (data[0]) {
               // заполняем шаблон сообщения полученными данными
               if (data[0]['last_message'].author['id'] === parseInt(user)) {
                   clone = message_box_user.cloneNode(true);
                   clone.removeAttribute('style');
                   clone.setAttribute('data-message-id', data[0]['last_message'].id);
                   clone.setAttribute('data-message-slug', data[0]['last_message'].slug_message);
                   date = clone.querySelector('.message-date-pub-user');
                   date_uts = data[0]['last_message'].date_pub.match(/(\d+)-(\d+)-(\d+)\D(\d+)\D(\d+).+/);
                   date.innerHTML = date_uts[3] + ' ' + mouth[date_uts[2]] + ' ' + date_uts[1] + ' г. ' + date_uts[4] + ':' + date_uts[5];
                   var div = clone.querySelector('.create-item-message-id');
                   div.classList.remove('create-item-message-id');
                   div.classList.add('item-message-id');
                   div.classList.add('user');
                   p = div.querySelector('p');
                   p.setAttribute('id', data[0]['last_message'].id);
                   p.innerHTML = data[0]['last_message'].message;
                   innerMessage.appendChild(clone); // добавляем новое сообщение в пулл
                   ScrollDownPage(); // пролистываем страницу до новго сообщения
               }
           }
        }
    });
}

// устанавливаем интервал запроса сообщений из БД
window.setInterval(RequestMessageFriend, 3000);

// функция добавления сообщений от собеседника
function RequestMessageFriend() {
    var message_box_friend = document.getElementById('message-box-friend');
    var user = message_box_user.getAttribute('data-user');
    var mouth = {'01': 'января', '02': 'февраля', '03': 'марта',
        '04': 'апреля', '05': 'мая', '06': 'июня', '07': 'июля',
        '08': 'августа', '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'};
    $.ajax({
       url: '/requestMessage/Friend/',
       type: 'GET',
       data: {
           chat_id: message_box_user.getAttribute('data-chat-id') // так же передаем айди чата
        },
        success: function (data) {
           var clone;
           var date;
           var date_uts;
           var p;
           if (data[0]){ // проверяем, что бы данные не были пустыми
                if (data[0]['last_message'].author['id'] !== parseInt(user)) { // проверяем, что автор не "я"
                   clone = message_box_friend.cloneNode(true);
                   clone.removeAttribute('style');
                   var href = clone.querySelectorAll('a');
                   for (var i = 0; i < href.length; i++) {
                       href[i].setAttribute('href', '/person/' + data[0]['last_message'].author['slug'] + '/');
                   }
                    var author_message = clone.querySelector('.message-author a');
                    author_message.innerHTML = data[0]['last_message'].author['first_name'];
                    date = clone.querySelector('.message-date-pub');
                    date_uts = data[0]['last_message'].date_pub.match(/(\d+)-(\d+)-(\d+)\D(\d+)\D(\d+).+/);
                    date.innerHTML = date_uts[3] + ' ' + mouth[date_uts[2]] + ' ' + date_uts[1] + ' г. ' + date_uts[4] + ':' + date_uts[5];
                    var item_message_id = clone.querySelector('.item-message-id');
                    item_message_id.setAttribute('data-message-id', data[0]['last_message'].id);
                    item_message_id.setAttribute('data-message-slug', data[0]['last_message'].slug_message);
                    p = item_message_id.querySelector('p');
                    p.setAttribute('id', data[0]['last_message'].id);
                    p.innerHTML = data[0]['last_message'].message;
                    var img = clone.querySelector('img');
                    $.ajax({ // запрашиваем аватар собеседника
                        url: '/requestAvatar/',
                        async: false, // важно, запрос делаем асинхронным
                        type: 'GET',
                        data: {
                            slug: data[0]['last_message'].author['slug'] // передаем слаг пользователя
                        },
                        success: function (avatar) {
                            if (avatar[0]) { // проверяем, что аватар есть
                                img.src = avatar[0]['photo'].photo;
                            } else {
                                img.src = '/static/default_avatar.jpg';
                            }
                        }
                    });
                    innerMessage.appendChild(clone); // добавляем в пулл
                    ScrollDownPage(); // пролистываем
                    var allP = document.querySelectorAll('.item-message-id.user p');
                    for (var e = 0; e < allP.length; e++) {
                        allP[e].removeAttribute('style'); // переводим сообщения от "меня" в статус прочитанных
                    }
               }
           }
        }
    });
}

// функции показа и работы с выпадающим меню

var addPhotoBox = $('.add-photo');
var addAudioBox = $('.add-audio');
var addVideoBox = $('.add-video');

window.addEventListener('click', function (event) {
   if (event.target.closest('.photo-files')) { // проверяем, что мы жмем на кнопку вызова меню
       toggleBoxPhotoFile();
   } else if (event.target.closest('.audio-files')) {
       toggleBoxAudioFiles();
   } else if (event.target.closest('.video-files')) {
       toggleBoxVideoFiles();
   } else if (event.target.closest('.add-photo')) { // проверяем, что мы жмем внутри меню
       addPhotoBox.css('display', 'block');
   } else if (event.target.closest('.add-video')) {
       addVideoBox.css('display', 'block');
   } else if (event.target.closest('.add-audio')) {
       addAudioBox.css('display', 'block');
   } else {
       hideBoxMediaFiles(); // вызываем функцию скрытия меню, если клики вне областей проверки
   }
});

function toggleBoxPhotoFile() { // визуализация показа блока меню
    addPhotoBox.fadeToggle(500);
}

function toggleBoxAudioFiles() {
    addAudioBox.fadeToggle(500);
}

function toggleBoxVideoFiles() {
    addVideoBox.fadeToggle(500);
}

function hideBoxMediaFiles() { // скрытие блока меню
    addPhotoBox.fadeOut(500);
    addAudioBox.fadeOut(500);
    addVideoBox.fadeOut(500);
    CancelSearch(); // вызываем фукцию очистки поисковых запросов
}

// функция прикрепления меди файлов к сообщениям
function addMediaFile(event) {
    var obj;
    // определяем из какой области будет файл
    if (event.target.closest('.photo-file')) {
        obj = event.target.closest('.photo-file');
    } else if (event.target.closest('.audio-file')) {
        obj = event.target.closest('.audio-file');
    } else if (event.target.closest('.video-file')) {
        obj = event.target.closest('.video-file');
    }
    var clone = obj.cloneNode(true);
    if (clone.className === 'video-file' || clone.className === 'video-file search-box') {
        var video = clone.querySelector('video');
        video.setAttribute('controls', 'controls'); // к видео файлу добавляем аттрибут, что бы видео можно было просмотреть
    }
    clone.classList.add('create-file'); // добавляем суб класс для нужной отрисовки файла в шаблоне
    var cancel = clone.querySelector('.bi.bi-x');
    cancel.removeAttribute('style');
    clone.removeAttribute('onclick');
    blockMedia.appendChild(clone); // добавляем файл в блок хранения перед отправкой
}

// функция удаления медиа файлов
function DeleteFile(event) {
    var obj;
    // проверяем, что удалять
    if (event.target.closest('.photo-file')) {
        obj = event.target.closest('.photo-file');
    } else if (event.target.closest('.audio-file')) {
        obj = event.target.closest('.audio-file');
    } else if (event.target.closest('.video-file')) {
        obj = event.target.closest('.video-file');
    }
    obj.remove(); // удаляем файл из блока хранения
}

// функции поиска медиа файлов в выпадающем меню

var searchResAudio = $('.searchRes.audio');
var searchResVideo = $('.searchRes.video');
var listAudio = $('.list-audio');
var listVideo = $('.list-video');
var cancel = $('.bi-cancel');
var inputSearch = $('.search-input');

// поиск аудио файлов
function searchAudioFile() {
    var search_input = document.getElementById('SearchInputAudio');
    var user = search_input.getAttribute('data-user');
    var searchRes = document.querySelector('.searchRes.audio');
    if (search_input.value !== '') {
        $.ajax({
            url: '/search/Audios/',
            type: 'GET',
            data: {
                num_tab: 1, // задаем область поиска
                user: user, // у кого ищем
                q: search_input.value // что ищем
            },
            success: function (data) {
                // заполняем шаблон аудио файла полученными данными
                var boxAudio = document.querySelector('.audio-file.search-box');
                searchRes.innerHTML = '';
                for (var key in  data) {
                    var clone = boxAudio.cloneNode(true);
                    clone.removeAttribute('style');
                    var name = clone.querySelector('p');
                    name.innerHTML = data[key].author_track + ' - ' + data[key].title_track;
                    var audio = clone.querySelector('audio');
                    audio.src = data[key].audio;
                    searchRes.appendChild(clone);
                }
                showSearch(); //  активируем функцию показа найденного
                hideList(); // активируем функцию скрытия имеющегося списка аудио записей
            }
        });
    }
}

// поиск видео
function searchVideoFile() {
    var search_input = document.getElementById('SearchInputVideo');
    var user = search_input.getAttribute('data-user');
    var searchRes = document.querySelector('.searchRes.video');
    if (search_input.value !== '') {
        $.ajax({
            url: '/search/Video/',
            type: 'GET',
            data: {
                num_tab: 1,
                user: user,
                q: search_input.value
            },
            success: function (data) {
                var boxVideo = document.querySelector('.video-file.search-box');
                searchRes.innerHTML = '';
                for (var key in  data) {
                    var clone = boxVideo.cloneNode(true);
                    clone.removeAttribute('style');
                    var video = clone.querySelector('video');
                    video.poster = data[key].poster;
                    var source = video.querySelector('source');
                    source.src = data[key].video;
                    searchRes.appendChild(clone);
                }
                showSearch();
                hideList();
            }
        });
    }
}

function showSearch() { // анимирование показа
    searchResAudio.slideDown(500);
    searchResVideo.slideDown(500);
    cancel.fadeIn(500);
}

function hideList() { // анимирование скрытия
    listAudio.fadeOut(500);
    listVideo.fadeOut(500);
}

function CancelSearch() { // анимирование очистки блока меню после поиска
    searchResAudio.fadeOut(500);
    searchResVideo.fadeOut(500);
    cancel.fadeOut(500);
    setTimeout(function () {
        listAudio.fadeIn(500);
        listVideo.fadeIn(500);
        searchResAudio.html('');
        searchResVideo.html('');
        inputSearch.val('');
    }, 500);
}
