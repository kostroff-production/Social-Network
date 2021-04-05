
// функция показа описания к видео
function showDescriptions(event) {
    var parent = event.target.closest('.descriptionVideo');
    var a = parent.querySelector('a');
    var block = parent.querySelector('.descriptions');
    var Hide = a.getAttribute('data-text-hide');
    var Show = a.getAttribute('data-text-show');
    if (a.innerHTML === Hide) {
        a.innerHTML = Show;
        block.style.display = 'block';
    } else if (a.innerHTML === Show) {
        a.innerHTML = Hide;
        block.style.display = 'none';
    }
}

var backgroundDiv = document.getElementById('backgroundDivRePost');
var VideoForm = document.getElementById('AddVideo');
var title_video = document.getElementById('id_title_video');
var descriptionVideo = document.getElementById('id_description_video');
var titleFalse = document.querySelector('.CreateTitle');
var descriptionFalse = document.querySelector('.CreateName');
var video = document.getElementById('id_video');
var poster = document.getElementById('id_poster');

// фунция показа формы для добавления видео
function showFormAddVideo() {
    var body = document.body;
    backgroundDiv.style.display = 'block';
    VideoForm.style.display = 'block';
    // позиционируем форму
    VideoForm.style.left = (body.offsetWidth - VideoForm.offsetWidth) / 2 + 'px';
    VideoForm.style.top = VideoForm.offsetHeight / 2 + 'px';
}

// функция очискти данных формы
function cancelForm() {
    backgroundDiv.style.display = 'none';
    VideoForm.style.display = 'none';
    VideoForm.style.top = 0;
    VideoForm.style.left = 0;
    video.value = null;
    poster.value = null;
    title_video.value = '';
    titleFalse.innerHTML = '';
    descriptionVideo.innerHTML = '';
    descriptionFalse.innerHTML = '';
}

// функция передачи описания из шаблона в скрытые поля формы
function saveVideoFile() {
    title_video.value = titleFalse.innerHTML;
    descriptionVideo.innerHTML = descriptionFalse.innerHTML;
}

// функция удаления видео
function DeleteVideo(event) {
    var video = event.target.closest('.video-box');
    var obj_id = video.getAttribute('id');
    $.ajax({
       url: '/Video/Delete/',
       type: 'POST',
       data: {
           id_obj: obj_id.replace(/\w+-/, '') // передаем числовое значение айди модели видео
       },
       success: function () {
           video.style.display = 'none'; // скрываем блок после выполнения
       }
    });
}

var searchResVideo = $('.searchRes.video');
var listVideo = $('.list-video');
var cancel = $('.bi-cancel');
var inputSearch = $('.search-input');

// функция поиска видео
function searchVideoFile() {
    var search_input = document.getElementById('SearchInputVideo');
    var searchRes = document.querySelector('.searchRes.video');
    var user = search_input.getAttribute('data-user');
    if (search_input.value !== '') { // проверяем, что запрос не пустой
        $.ajax({
            url: '/search/Video/',
            type: 'GET',
            data: {
                num_tab: 1, // область поиска
                user: user, // у кого ищем
                q: search_input.value // что ищем
            },
            success: function (data) {
                searchRes.innerHTML = ''; // очищаем блок от старых запросов
                for (var key in  data) {
                    // находим видео в шаблоне, клонируем и выводим в список искомых
                    var video = document.getElementById('video-' + data[key].id);
                    var clone;
                    if (video) {
                        clone = video.cloneNode(true);
                        searchRes.appendChild(clone);
                    } else {
                        // в случае если видео нет, выводим сообщение
                        searchRes.innerHTML = '<h4 style="text-align: center; color: #666666">Ничего не нашлось</h4>';
                    }
                }
                showSearch(); // активируем функцию показа найденного
                hideList(); // скрываем текущие видео
            }
        });
    }
}

// функция показа найденных видео
function showSearch() {
    searchResVideo.slideDown(500);
    cancel.fadeIn(500);
}

// функция скрытия данных страницы
function hideList() {
    listVideo.fadeOut(500);
}

// функция очистки поискового запроса
function CancelSearch() {
    searchResVideo.fadeOut(500);
    cancel.fadeOut(500);
    setTimeout(function () {
        listVideo.fadeIn(500);
        searchResVideo.html('');
        inputSearch.val('');
    }, 500);
}