var parent_block_re_post = document.querySelector('.Re-Post');
var blockSearchFriend = document.querySelector('.Search-Friends');
var btnRepost = document.querySelector('.button-re-post');
var input = document.getElementById('message-re-post');
var text = input.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim();
var exit = document.querySelector('.bi.bi-x-square-fill');
    exit.addEventListener('click', Close);
var checkbox = document.querySelectorAll('.checkbox-re-post');
for (var e = 0; e < checkbox.length; e++) {
    checkbox[e].addEventListener('click', onlyOne);
}

// функция переключения ползунков, в зависимости от выбора репоста
var check;
function onlyOne() {
    for (e = 0; e < checkbox.length; e++) {
            checkbox[e].checked = false;
        }
    this.checked = true; // чекнутым должен быть только один ползунок
    check = this.value;
    if (check === '2') { // если отправляем сообщением
        showSearchInput(); // показываем блок с пользователями. комы можно отправить
    } else if (check === '1') { // если репостим в пост
        hideSearchInput(); // то скрываем блок с пользователями
    }
}

var searchBlock = $('.Search-Friends');
// функция анимирования показа блока
function showSearchInput() {
    searchBlock.show(500);
}

// функция анимирования скрытия блока
function hideSearchInput() {
    searchBlock.hide(500);
}

// функция анимированного показа найденных пользователей
var listFriendsResult = $('.Result-Friends');
function toggleListFriends () {
    listFriendsResult.slideToggle(500);
}

var searchInput = document.querySelector('.Search-input');
searchInput.addEventListener('keyup', searchFriend); // навешиваем на инпут функцию поиска друзей

// функция поиска друзей
function searchFriend() {
    var object_id = searchInput.getAttribute('data-object_id');
    var searchRes = document.querySelector('.Result-Search');
    searchRes.innerHTML = ''; // очищаем прошлое значение

    if (searchInput.innerHTML !== '') { // проверяем, что бы запрос был не пустой
        showSearchFriend();
        $.ajax({
            url: '/search/Friends/',
            type: 'GET',
            data: {
                num_tab: 1, // задаем диапозон поиска
                user: object_id, // у кого искать
                q: searchInput.innerHTML // кого искать
            },
            success: function (data) {
                for (var key in data) {
                    // создаем тег с друзьями
                    var p = document.createElement('p');
                    p.setAttribute('data-id', 'user-' + data[key]['friends']['id']);
                    p.innerHTML = data[key]['friends']['first_name'] + ' ' + data[key]['friends']['last_name'];
                    p.addEventListener('click', transferID);
                    searchRes.appendChild(p); // добавляем его в пулл найденных
                }
            }
        });
    } else {
        hideSearchFriend();
    }
}

// функции анимированного показа друзей

var divSearchResFriend = $('.Result-Search');
function showSearchFriend() {
    divSearchResFriend.slideDown(500);
}

function hideSearchFriend() {
    divSearchResFriend.slideUp(500);
}

var backgroundDivRePost = document.getElementById('backgroundDivRePost');
var PostInput = document.getElementById('PostInput');
var checkUser = document.querySelector('.check-user');

// функция подготовки к репосту
function Router(event) {
    var target = event.target;

    var slug_user = btnRepost.getAttribute('data-slug');
    var slug_page_person = document.location.href.match(/.+\/\/.+\/(.+)\/(.+?)\//);
    var slug_page_photo = document.location.href.match(/.+\/\/.+\/(.+?)\/.+\//);
    var slug_page_album_detail = document.location.href.match(/.+\/\/.+\/.+\/(\d+?)\/(\d+?)\/(\w+\/\w+)\//);

    // репост объекта в "пост" нельзя делать из своих файлов
    for (e = 0; e < checkbox.length; e++) {
        // проверяем от куда мы ходим сделать репост
        if (slug_page_person) {
            if (slug_page_person[1] === 'person' && slug_page_person[2] === slug_user) {
                checkbox[0].setAttribute('disabled', true);
            }
        } else if (slug_page_photo) {
            if (slug_page_photo[1] === slug_user) {
                checkbox[0].setAttribute('disabled', true);
            }
        } else if (slug_page_album_detail) {
            if (slug_page_album_detail[1] === slug_user)
                checkbox[0].setAttribute('disabled', true);
        }
    }

    // активируем форму репоста
    if (parent_block_re_post.style.display === 'none') {
        parent_block_re_post.style.display = 'block';
        backgroundDivRePost.style.display = 'block';
        if (PostInput) {PostInput.setAttribute('style', 'z-index: -1;');}
        var body = document.body;
        if (body.offsetWidth > 420) {
            parent_block_re_post.style.left = (body.offsetWidth - parent_block_re_post.offsetWidth) / 2 + 'px';
            parent_block_re_post.style.top = parent_block_re_post.offsetHeight / 2 + 'px';
        } else {
            parent_block_re_post.style.left = (body.offsetWidth - parent_block_re_post.offsetWidth) / 2 + 'px';
            parent_block_re_post.style.top = parent_block_re_post.offsetHeight / 4 + 'px';
        }
    }

    // проверяем, какой объект модели мы хотим зарепостить
    if (target.closest('.btn-bi.re-post-audio')) {
        var audio = target.closest('.audio-track');
        var boxAudio = audio.querySelector('.audio-player-box');
        var audio_id = boxAudio.getAttribute('id'); // забираем айди объекта
        btnRepost.setAttribute('data-obj-pk', audio_id); // передаем его для дальнейшей обработки
        btnRepost.addEventListener('click', RePostObj); // навешиваем функцию отправки репоста
    }else if (target.closest('.btn-bi.re-post-video')) {
        var video = target.closest('.video-box');
        var video_id = video.getAttribute('id');
        btnRepost.setAttribute('data-obj-pk', video_id);
        btnRepost.addEventListener('click', RePostObj);
    } else if (target.closest('.btn-bi.re-post-post')) {
        var post = target.closest('.post');
        var post_id = post.getAttribute('id');
        btnRepost.setAttribute('data-obj-pk', post_id);
        btnRepost.addEventListener('click', RePostObj);
    } else if (target.closest('.btn-bi.re-post-photo')) {
        var photo = target.closest('.gallery-item');
        var photo_id = photo.getAttribute('id');
        btnRepost.setAttribute('data-obj-pk', photo_id);
        btnRepost.addEventListener('click', RePostObj);
    } else if (target.closest('.body-drop.re_post')) {
        var group = target.closest('.body-drop.re_post');
        var group_id = group.getAttribute('data-id');
        btnRepost.setAttribute('data-obj-pk', group_id);
        btnRepost.addEventListener('click', RePostObj);
    }
}

// функция скрытия формы репоста
function Close() {
    // очищаем все ранее заполненные строки формы
    parent_block_re_post.style.display = 'none';
    backgroundDivRePost.style.display = 'none';
    if (PostInput) {PostInput.removeAttribute('style');}
    check = 0;
    checkUser.style.display = 'none';
    checkUser.innerHTML = '';
    searchInput.innerHTML = '';
    input.innerHTML = '';
    blockSearchFriend.style.display = 'none';
    btnRepost.removeAttribute('data-id');
    btnRepost.removeAttribute('data-obj-pk');

    for (e = 0; e < checkbox.length; e++) {
            checkbox[e].checked = false;
        }
}

// функция выделения выбранного юзера для отправки ему репоста
function transferID(event) {
    var user_id = event.target.getAttribute('data-id');
    btnRepost.setAttribute('data-id', user_id);
    checkUser.style.display = 'inline-block';
    checkUser.innerHTML = event.target.innerHTML;
    hideBlockFriend(); // скрываем список друзей после выбора
}

// фукция анимирования скрытия блока
function hideBlockFriend() {
    listFriendsResult.slideUp(200);
    divSearchResFriend.slideUp(200);
}

var resFriendsP = document.querySelectorAll('.Result-Friends p');
for (var p = 0; p < resFriendsP.length; p++) {
    sliceTXT(resFriendsP[p]);
}
// функция ограничения длинны имени друга или чата
function sliceTXT(txt) {
    if (txt.innerText.length <= 40) {
        txt.innerText = txt.innerText;
    } else {
        txt.innerText = txt.innerText.slice(0, 40) + '...';
    }
}

// функция репоста объекта
function RePostObj() {
    var obj_id = this.getAttribute('data-obj-pk');
    var obj = document.getElementById(obj_id); // забираем объект репоста
    var obj_type = obj.getAttribute('data-obj');

    // проверяем, если объект аудио трек, то мы извлекаем альбом для него
    var author_track = obj.querySelector('.track-name');
    if (author_track) {
        var img = obj.querySelector('img');
        var name = author_track.innerHTML.match(/(.+)\s+-\s+.+/);
        $.ajax({
            url: '/serializers/AlbumAudioTrack/',
            async: false, // важно установить синхронность запроса
            type: 'GET',
            data: {
                author_track: name[1]
            },
            success: function (album) {
                if (album[0]) { // если альбом есть то устанавливаем
                    img.src = album[0].photo;
                } else { // если нет то базовый
                    img.src = '/media/user_16131596871613159687/photo/AlbumDefault.jpg';
                }
            }
        });
    }

    // клонируем объект и подгоняем его под "модель репоста"
    var clone = obj.cloneNode(true);
    var drop_menu = clone.querySelector('.drop-menu');
    if (drop_menu) {
        drop_menu.remove();
        var btnMenu = clone.querySelector('.group-body.menu');
        btnMenu.remove();
    }
    var button = clone.querySelector('.bi-base');
    if (button) {
        button.remove();
    }
    var bi_x = clone.querySelector('.bi.bi-x');
    if (bi_x) {
        clone.removeChild(bi_x);
    }
    var link_descriptions = clone.querySelector('.link-descriptions');
    if (link_descriptions) {
        link_descriptions.remove();
    }
    clone.classList.add('re-post');
    var author_href = clone.getAttribute('data-author-obj');
    if (author_href) {
        var author_block = document.createElement("div");
        author_block.setAttribute('class', 'bi-base-re-post');
        var a = document.createElement('a');
        var author_username = clone.getAttribute('data-author-username');
        a.setAttribute('href', author_href);
        a.setAttribute('target', '_blank');
        a.innerHTML = 'источник: ' + author_username;
        author_block.appendChild(a);
        clone.appendChild(author_block);
    }
    clone.removeAttribute('id');
    clone.removeAttribute('data-author-obj');
    clone.removeAttribute('data-author-username');
    clone.removeAttribute('style');
    var blockObj = document.createElement("div");
    blockObj.appendChild(clone); // создаем и добавляем получившийся объект в блок для отправки

    // убираем лишние пробелы
    var str = input.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim();
    var message = str + '<br>' + blockObj.innerHTML; // добавляем к сообщению модель репоста
    var slug = this.getAttribute('data-slug');
    var pk_obj_re_post = obj.getAttribute('data-re-post-pk');
    var pk_obj = obj_id.replace(/\w+-/, '');

    // проверяем куда мы направляем репост
    if (check === '1') { // в пост
        $.ajax({
            url: '/Post/Create/',
            type: 'POST',
            data: {
                slug: slug,
                message: message
            },
            success: function () {
                if (author_track || drop_menu) {
                    Close();
                } else {
                    $.ajax({
                        url: '/' + obj_type + '/RePost/',
                        type: 'GET',
                        data: {
                            obj_pk: pk_obj,
                            obj_re_post_pk: pk_obj_re_post
                       },
                        success: function (data) {
                            obj.querySelector('div[data-count="RePosts"]').innerText = data[0]['recipients'].length;
                            obj.setAttribute('data-re-post-pk', data[0]['id']);
                            Close();
                        }
                    });
                }
            }
        });
    }else if (check === '2') { // в диалог
        var data_id = this.getAttribute('data-id').match(/(\w+)-(.+?)/); // забираем айди пользователя, которому хотим репост сделать

        if (data_id[1] === 'user') {
            $.ajax({
               url: '/dialogs/',
               type: 'POST',
               data: {
                   user_one: data_id[2], // отправляем айди для проверки наличие диалога с ним
               },
               success: function (data) {
                   var chat_id = data.match(/data-chat-id="(.+?)"/); // получаем номер чата
                   $.ajax({
                        url: '/dialogs/' + chat_id[1] + '/', // передаем в чат
                        type: 'POST',
                        data: {
                            message: message,
                        },
                        success: function () {
                            if (author_track || drop_menu) {
                                Close();
                            } else {
                                $.ajax({
                                    url: '/' + obj_type + '/RePost/',
                                    type: 'GET',
                                    data: {
                                        obj_pk: pk_obj,
                                        obj_re_post_pk: pk_obj_re_post
                                   },
                                    success: function (data) {
                                        // после репоста очищаем форму ремоста и подгружаем данные о репосте объекта в шаблон
                                        obj.querySelector('div[data-count="RePosts"]').innerText = data[0]['recipients'].length;
                                        obj.setAttribute('data-re-post-pk', data[0]['id']);
                                        Close();
                                    }
                                });
                            }
                        },
                    });
               }
            });
        } else if (data_id[1] === 'chat') { // в чат
            $.ajax({
                url: '/dialogs/' + data_id[2] + '/',
                type: 'POST',
                data: {
                    message: message,
                },
                success: function () {
                    if (author_track || drop_menu) {
                        Close();
                    } else {
                        $.ajax({
                            url: '/' + obj_type + '/RePost/',
                            type: 'GET',
                            data: {
                                obj_pk: pk_obj,
                                obj_re_post_pk: pk_obj_re_post
                           },
                            success: function (data) {
                                obj.querySelector('div[data-count="RePosts"]').innerText = data[0]['recipients'].length;
                                obj.setAttribute('data-re-post-pk', data[0]['id']);
                                Close();
                            }
                        });
                    }
                },
            });
        }
    }
}


