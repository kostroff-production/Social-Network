// функции создания разметки и позиционирования фотографий

var gallery = document.querySelector('#gallery');
var getVal = function (elem, style) { return parseInt(window.getComputedStyle(elem).getPropertyValue(style)); };
var getHeight = function (item) { return item.querySelector('.content').getBoundingClientRect().height; };
var resizeAll = function () {
    var altura = getVal(gallery, 'grid-auto-rows');
    var gap = getVal(gallery, 'grid-row-gap');
    gallery.querySelectorAll('.gallery-item').forEach(function (item) {
        var el = item;
        el.style.gridRowEnd = "span " + Math.ceil((getHeight(item) + gap) / (altura + gap));
    });
};
if (gallery) {
    gallery.querySelectorAll('img').forEach(function (item) {
        item.classList.add('byebye');
        window.addEventListener('load', function () {
            var altura = getVal(gallery, 'grid-auto-rows');
            var gap = getVal(gallery, 'grid-row-gap');
            var gitem = item.parentElement.parentElement;
            gitem.style.gridRowEnd = "span " + Math.ceil((getHeight(gitem) + gap) / (altura + gap));
            item.classList.remove('byebye');
        });
    });
    window.addEventListener('resize', resizeAll);
    gallery.querySelectorAll('.gallery-item').forEach(function (item) {
        item.addEventListener('click', function () {
            item.classList.toggle('full');
            var bi = item.querySelector('.bi-base');
            bi.classList.toggle('full');
        });
    });
}

var backgroundDivForm = document.getElementById('backgroundDivForm');
var AddAlbum = document.getElementById('AddAlbum');
var AddPhotos = document.getElementById('AddPhotos');
var CreateName = document.querySelector('.CreateName');
if (CreateName) {
    CreateName.addEventListener('keyup', InputValue);
}
var id_descriptionAlbum = document.getElementById('id_descriptionAlbum');
var id_albumSelect = document.getElementById('id_album');
var body = document.body;

// функция показа формы создания альбома
function showFormAddAlbum() {
    if (AddAlbum.style.display === 'none') {
        backgroundDivForm.style.display = 'block';
        AddAlbum.style.display = 'block';
        AddAlbum.style.left = (body.offsetWidth - AddAlbum.offsetWidth) / 2 + 'px';
        AddAlbum.style.top = AddAlbum.offsetHeight + 'px';
    }
}

// функция показа формы создания фотографии
function showFormAddPhoto() {
    if (AddPhotos.style.display === 'none') {
        backgroundDivForm.style.display = 'block';
        AddPhotos.style.display = 'block';
        AddPhotos.style.left = (body.offsetWidth - AddPhotos.offsetWidth) / 2 + 'px';
        AddPhotos.style.top = AddPhotos.offsetHeight + 'px';
        var url = document.location.href.match(/.+\/\/.+\/.+\/(\d+?)\/(\d+?)\/(\w+\/\w+)\//);
        var optionAll = id_albumSelect.querySelectorAll('option');
        // проверяем где создаем фото, в альбоме или в галлерее
        if (url) {
            if (url[3] === 'Album/Detail') { // если создаем фото в альбоме, то в форме указываем альбом
                for (var i = 0; i < optionAll.length; i++) {
                    optionAll[i].removeAttribute('selected');
                }
                var option = id_albumSelect.querySelector('option[value="' + url[2] + '"]');
                option.selected = true;
                AddPhotos.addEventListener('mouseover', function (event) {
                    // альбом нельзя изменить
                    if (event.target === id_albumSelect) {
                        id_albumSelect.setAttribute('disabled',true);
                    } else {
                        id_albumSelect.removeAttribute('disabled');
                    }
                });
            }
        } else { // если создаем в галлерее
            var albums = AddPhotos.getAttribute('data-album').split(' ');
            for (var e = 0; e < optionAll.length; e++) {
                optionAll[e].style.display = 'none';
                for (var a = 0; a < albums.length - 1; a++) {
                    if (optionAll[e].value === albums[a]) {
                        optionAll[e].style.display = 'block'; // показываем доступные альбомы для добавления
                    }
                }
            }
        }
    }
}

var errorMessageAlbum = document.querySelector('.alert.alert-danger');

// функция переноса описание альбома в сроку формы
function InputValue() {
    id_descriptionAlbum.value = this.innerText;
    errorMessageAlbum.style.display = 'none';
}

// фукция вывода ошибки
function errorMessage() {
    if (id_descriptionAlbum.value === '') { // если пользователь хочет создать альбом без названия
        errorMessageAlbum.style.display = 'inline-block';
    } else {
        errorMessageAlbum.style.display = 'none';
    }
}

// функция скрытия форм
function cancelForm() {
    // очищаем все ранее введенные данные
    backgroundDivForm.style.display = 'none';
    if (AddAlbum) {
        AddAlbum.style.display = 'none';
        AddAlbum.style.top = 0;
        AddAlbum.style.left = 0;
        CreateName.innerHTML = '';
    }
    if (AddPhotos) {
        AddPhotos.style.display = 'none';
        AddPhotos.style.top = 0;
        AddPhotos.style.left = 0;
    }
}

// функция удаления альбома и фотографии
function DeletePhoto(event) {
    var photo = event.target.closest('.gallery-item');
    var album = event.target.closest('.buttonsCreate');
    var obj_id;
    var data_obj; // указываем какой тип данных нужно удалить
    // проверяем, что нужно удалять
    if (photo) {
        obj_id = photo.getAttribute('id');
        data_obj = photo.getAttribute('data-obj');
    } else if (album) {
        obj_id = album.getAttribute('data-id');
        data_obj = album.getAttribute('data-obj');
    }
    $.ajax({
       url: '/' + data_obj + '/Delete/',
       type: 'POST',
       data: {
           id_obj: obj_id.replace(/\w+-/, '') // передаем числовое значений айди модели для удаления
       },
       success: function () {
           if (photo) {
               photo.style.display = 'none';
           } else if (album) {
                var url = document.location.href.match(/(.+\/\/.+\/.+\/\d+?\/)\d+?\/\w+\/\w+\//);
                document.location.href = url[1] + 'Photos/';
           }
       }
    });
}

// фукция показа описания к фото
function descriptionPhoto(event) {
    var gallery = event.target.closest('.gallery-item');
    var description = gallery.querySelector('.descriptionText');
    description.classList.toggle('full');
    var background = gallery.querySelector('.backgroundDiv');
    background.classList.toggle('full');
    return false; // указываем false, что бы не было выхода из полноэкранного режима
}

// функция задержки фото в полноэкранном режиме
function blockClick() {
    return false;
}

// переменные создаем через JQuery, что бы отрабатывал false в наших функциях
$('.backgroundDiv').click(blockClick);
$('.descriptionText').click(blockClick);

$('.btn-bi.descriptionPhoto').click(descriptionPhoto);