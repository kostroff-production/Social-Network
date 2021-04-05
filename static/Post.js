var Posts = document.getElementById('Posts');
var blockMedia = document.querySelector('.list-media-file');
var btnPublish = Posts.querySelector('.form_button');
if (btnPublish) {
    btnPublish.addEventListener('click', CreatePost);
}

// функция создания поста
function CreatePost(event) {
    event.preventDefault();
    var data_obj = this.getAttribute('data-obj');
    var input = Posts.querySelector('.form_input');
    var btnCancel = blockMedia.querySelectorAll('.bi.bi-x');
    // очищаем блок медиа от кнопок удаления
    if (btnCancel) {
        for (var i = 0; i < btnCancel.length; i++) {
            btnCancel[i].remove();
        }
    }
    var photo = blockMedia.querySelectorAll('.photo-file.create-file');
    if (photo) { // меняем класс для фотографий, для корректной отрисовки
        for (var e = 0; e < photo.length; e++) {
            photo[e].classList.remove('photo-file');
            photo[e].classList.remove('create-file');
            photo[e].classList.add('gallery-item');
            photo[e].classList.add('re-post');
        }
    }

    // проверяем где создаем пост, в личном профиле или группе
    var url;
    if (data_obj) {
        url = '/Post/Create/' + data_obj;
    } else {
        url = '/Post/Create/';
    }

    // очищам сообщение от личшних пробелов и добавляем блок с медиафайлами
    var message = input.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim() + blockMedia.innerHTML;
    var slug = input.getAttribute('data-slug');
    if (message !== '') { // проверяем, что бы инпут не был пустым
        $.ajax({
            url: url,
            type: 'POST',
            data: {
                slug: slug, // передаем слаг группы или юзера
                message: message,
            },
            success: function () {
                btnPublish.blur();
                RequestPost(); // активируем функцию добавления поста в пулл
                input.innerHTML = '';
                blockMedia.innerHTML = '';
            }
        });
    } else {
        btnPublish.blur(); // сбрасываем таргет
    }
}

// функция отрисовки поста
function RequestPost() {
    var post_input = document.getElementById('PostInput');
    var post = document.getElementById('post-create');
    var mouth = {'01': 'января', '02': 'февраля', '03': 'марта',
        '04': 'апреля', '05': 'мая', '06': 'июня', '07': 'июля',
        '08': 'августа', '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'};
    $.ajax({
        url: '/requestPost/',
        type: 'GET',
        success: function (data) {
            // после получения данных заполняем шаблон поста
            var clone = post.cloneNode(true);
            clone.removeAttribute('style');
            clone.setAttribute('id', 'post-' + data[0].id);
            clone.setAttribute('data-author-obj', '/person/' + data[0]['user'].slug + '/');
            clone.setAttribute('data-author-username', data[0]['user'].first_name + ' ' + data[0]['user'].last_name);
            var date = clone.querySelector('.post_date i');
            var date_uts = data[0].date_pub.match(/(\d+)-(\d+)-(\d+)\D(\d+)\D(\d+).+/);
            date.innerHTML = date_uts[3] + ' ' + mouth[date_uts[2]] + ' ' + date_uts[1] + ' г. ' + date_uts[4] + ':' + date_uts[5];
            var message = clone.querySelector('.post_message');
            message.innerHTML = data[0].message;
            var like = clone.querySelector('.btn-bi.like');
            like.setAttribute('data-slug', data[0].slug);
            like.setAttribute('data-id', data[0].id);
            var comment = clone.querySelector('.btn-bi.comment');
            comment.href = '/person/' + data[0].id + '/Post/Comment/';
            post_input.insertAdjacentElement('afterEnd', clone); // добавляем новый пост, после формы создания поста
        }
    });
}

// функция удаления поста
function DeletePost(event) {
    var post = event.target.closest('.post');
    var id_post = post.getAttribute('id');
    $.ajax({
       url: '/Post/Delete/',
       type: 'POST',
       data: {
           id_obj: id_post.replace(/\w+-/, '') // забираем числовое значени айди поста
       },
       success: function () {
           post.style.display = 'none'; // скрываем пост в списке
       }
    });
}

// функция показа фотографий в полноэкранном режиме
document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('click', function () {
        if (Posts.offsetWidth > 420) { // доступно только на больших экранах
            item.classList.toggle('full'); // добавляем суб класс
            var image = item.querySelector('img');
            var body = document.body;
            image.style.top = (body.offsetHeight - image.offsetHeight) / 8 + 'px';
            image.style.left = (body.offsetWidth - image.offsetWidth) / 2 + 'px';
        }
    });
});

// функции анимирования дроп меню

var addPhotoBox = $('.add-photo');
var addAudioBox = $('.add-audio');
var addVideoBox = $('.add-video');

// функция работы с дроп меню
window.addEventListener('click', function (event) {
   if (event.target.closest('.photo-files')) { // проверяем, что нажатие было на кнопку вызова меню
       toggleBoxPhotoFile();
   } else if (event.target.closest('.audio-files')) {
       toggleBoxAudioFiles();
   } else if (event.target.closest('.video-files')) {
       toggleBoxVideoFiles();
   } else if (event.target.closest('.add-photo')) { // проверяем, что нажатие происходит внутри меню
       addPhotoBox.css('display', 'block');
   } else if (event.target.closest('.add-video')) {
       addVideoBox.css('display', 'block');
   } else if (event.target.closest('.add-audio')) {
       addAudioBox.css('display', 'block');
   } else {
       hideBoxMediaFiles(); // активируем функцию скрытия меню
   }
});

// функция анимационного появления блока
function toggleBoxPhotoFile() {
    addPhotoBox.slideToggle(500);
}

function toggleBoxAudioFiles() {
    addAudioBox.slideToggle(500);
}

function toggleBoxVideoFiles() {
    addVideoBox.slideToggle(500);
}

// функция скрытия блока меню
function hideBoxMediaFiles() {
    addPhotoBox.slideUp(500);
    addAudioBox.slideUp(500);
    addVideoBox.slideUp(500);
    CancelSearch(); // активируем функцию очистки поисковых запросов
}

// функция работы с медиафайлами
function addMediaFile(event) {
    var obj;
    // проверям, что хотим добавить
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
        video.setAttribute('controls', 'controls'); // для видео добавляем атрибут
    }
    clone.classList.add('create-file'); // добавляем класс для отрисовки стилей
    var cancel = clone.querySelector('.bi.bi-x');
    cancel.removeAttribute('style');
    clone.removeAttribute('onclick');
    blockMedia.appendChild(clone); // добавляем в блок медиа
}

// удаление медиа файлов из блока медиа
function DeleteFile(event) {
    var obj;
    // проверяем, что удаляем
    if (event.target.closest('.photo-file')) {
        obj = event.target.closest('.photo-file');
    } else if (event.target.closest('.audio-file')) {
        obj = event.target.closest('.audio-file');
    } else if (event.target.closest('.video-file')) {
        obj = event.target.closest('.video-file');
    }
    obj.remove(); // удаляем файл из блока
}

var searchResAudio = $('.searchRes.audio');
var searchResVideo = $('.searchRes.video');
var listAudio = $('.list-audio');
var listVideo = $('.list-video');
var cancel = $('.bi-cancel');
var inputSearch = $('.search-input');

// функция поиска аудио файла в дроп меню
function searchAudioFile() {
    var search_input = document.getElementById('SearchInputAudio');
    var user = search_input.getAttribute('data-user');
    var searchRes = document.querySelector('.searchRes.audio');
    if (search_input.value !== '') {
        $.ajax({
            url: '/search/Audios/',
            type: 'GET',
            data: {
                num_tab: 1, // задаем диапозон поиска
                user: user, // у кого ищем
                q: search_input.value // что ищем
            },
            success: function (data) {
                // после получения данных, заполняем шаблон формы аудио
                var boxAudio = document.querySelector('.audio-file.search-box');
                searchRes.innerHTML = '';
                for (var key in  data) {
                    var clone = boxAudio.cloneNode(true);
                    clone.removeAttribute('style');
                    var name = clone.querySelector('p');
                    name.innerHTML = data[key].author_track + ' - ' + data[key].title_track;
                    var audio = clone.querySelector('audio');
                    audio.src = data[key].audio;
                    searchRes.appendChild(clone); // добавляем файл в список найденных
                }
                showSearch(); // активируем функцию показа найденных файлов
                hideList(); // скрываем текущие аудио файлы
            }
        });
    }
}

// функция поиска видео
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
                // так же заполняем форму
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

// функция анимированног показа блока с файлами
function showSearch() {
    searchResAudio.slideDown(500);
    searchResVideo.slideDown(500);
    cancel.fadeIn(500);
}

//  функция анимированного скрытия блока с файлами
function hideList() {
    listAudio.fadeOut(500);
    listVideo.fadeOut(500);
}

// функция очистки формы поиска с полученными данными
function CancelSearch() {
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

