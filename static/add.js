// методы добавления медиа файлов
// методы подключаются в шаблоне

function AddAudio(event) {
    var audio = event.target.closest('.audio-track'); // при вызове функции мы ищем ближайшего родителя
    var obj_pk = audio.getAttribute('data-id'); // у него забираем айди медиа файла
    $.ajax({
       url: '/addAudio/',
       type: 'POST',
       data: {
           obj_pk: obj_pk // передаем айди для дальнейшей обработки во view
       },
       success: function () {
           toggleAddAudio(); // вызываем функцию всплывающего уведомления
       }
    });
}

function AddVideo(event) {
    var video = event.target.closest('.video-box');
    var obj_pk = video.getAttribute('id');
    $.ajax({
       url: '/addVideo/',
       type: 'POST',
       data: {
         obj_pk: obj_pk.replace(/\w+-/, '')
       },
       success: function () {
           toggleAddVideo();
       }
    });
}

function AddPhoto(event) {
    var gallery = event.target.closest('.gallery-item');
    var obj_pk = gallery.getAttribute('id');
    $.ajax({
        url: '/addPhoto/',
        type: 'POST',
        data: {
            obj_pk: obj_pk.replace(/\w+-/, '')
        },
        success: function () {
            toggleAddPhoto();
        }
    });
}

// т.к. методы применяемые в функции работают только через плагин JQuery
var successAddPhoto = $('#successAddPhoto'); // забираем из шаблона наш блок с уведомлением

function toggleAddPhoto() {
        successAddPhoto.fadeIn(800); // вызываем плавное появление блока
    setTimeout(function () {
        successAddPhoto.fadeOut(800); // затем плавное исчезновение
    }, 800);
}

var successAddAudio = $('#successAddAudio');

function toggleAddAudio() {
    successAddAudio.fadeIn(800);
    setTimeout(function () {
        successAddAudio.fadeOut(800);
    }, 800);
}

var successAddVideo =$('#successAddVideo');

function toggleAddVideo() {
    successAddVideo.fadeIn(800);
    setTimeout(function () {
        successAddVideo.fadeOut(800);
    }, 800);
}