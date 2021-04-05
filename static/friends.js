var tabs = document.getElementById('tabs');
var search_input = document.querySelector('.search-input');
var tab_txt;
createTabs(tabs);

// функция показа юзеров в зависмости от выбранной вкладки
function createTabs(root) {
    var items = root.getElementsByClassName('tabs__item'); // забираем вкладки
    var texts = root.getElementsByClassName('tabs__text'); // забираем содержимое блоков
    root.addEventListener('click', sliderFriends); // на таблицу невешиваем функцию показа блоков
    function sliderFriends(event) {
        var targ = event.target;
        if (targ.tagName !== 'LI') return;
        for (var i = 0; i < items.length; i++) { // очищаем все селекты
            items[i].classList.remove('select');
        }
        targ.classList.add('select'); // вешаем селект на старгетированный элемент
        for (var e = 0; e < texts.length; e++) {
            texts[e].style.display = 'none';
        }
        var id = $('.tabs__item.select').attr('data-id'); // забираем вкладку
        tab_txt = $('#'+id); // задаем значение переменной, обязательно через Jquery, потому что аттрибуты функции
        showTxt(); // показа содержимого блока, работает только через этот плагин

        search_input.value = '';
        var num_tab = id.replace(/\w+-/, ''); // для номера забираем только цифру

        // в зависимости от селекта, меняем содержимое value поисковика
        if (num_tab === '1') {
            search_input.placeholder = 'Поиск среди друзей....';
        } else if (num_tab === '2') {
            search_input.placeholder = 'Поиск среди друзей....';
        } else if (num_tab === '3') {
            search_input.placeholder = 'Поиск среди всех....';
        }
    }
}

// функция поиска юзеров
function searchResult() {
    var item = tabs.querySelector('.tabs__item.select');
    var texts = tabs.querySelectorAll('.tabs__text');
    for (var e = 0; e < texts.length; e++) { // скрываем содержимое блоков
            texts[e].style.display = 'none';
    }
    var num_tab = item.getAttribute('data-id').replace(/\w+-/, '');
    var tab_search = document.getElementById('tabs-search');
    var user = search_input.getAttribute('data-id');
    tab_search.innerHTML = ''; // очищаем блок показа искомых юзеров
    showSearch(); // запускаем функцию анимированного пока юзеров

    if (search_input.value !== '') { // проверяем что бы поисковой запрос не был пуст
        $.ajax({
            url: '/search/Friends/',
            type: 'GET',
            data: {
                num_tab: num_tab, // передаем ключ области поиска
                user: user, // у кого ищем
                q: search_input.value // кого ищем
            },
            success: function (data) {
                var friend;
                var clone;
                // в зависимости от вкладки, находим в шаблоне юзера, клонируем и добавляем в наш блок поиска
                if (num_tab === '1') {
                    for (var key1 in data) {
                        friend = document.getElementById('friend-' + data[key1]['friends']['id']);
                        if (friend) {
                            clone = friend.cloneNode(true);
                            tab_search.appendChild(clone);
                        }
                    }
                } else if (num_tab === '2') {
                    for (var key2 in data) {
                        friend = document.getElementById('friend-' + data[key2]['friends']['id']);
                        if (friend) {
                            clone = friend.cloneNode(true);
                            tab_search.appendChild(clone);
                        }
                    }
                } else if (num_tab === '3') {
                    for (var key3 in data) {
                        friend = document.getElementById('friend-' + data[key3]['id']);
                        if (friend) {
                            clone = friend.cloneNode(true);
                            tab_search.appendChild(clone);
                        }
                    }
                }
            }
        });
    } else { // если запрос пуст, выводим сообщение
        tab_search.innerHTML = '<h3 style="text-align: center">Задайте параметры поиска</h3>';
    }

}

// функции анимированного показа

var tabs_search = $('#tabs-search');
function showSearch() {
    tabs_search.slideDown(500);
}

function showTxt() {
    tab_txt.slideDown(500);
}

// функция запроса дружбы
function SendingToAdd(event) {
    var possible_friend = event.target.getAttribute('data-user');
    $.ajax({
        url: 'Create/',
        type: 'POST',
        data: {
            possible_friend: possible_friend, // передаем айди юзера, котрого хотим добавить
        },
        success: function () {
            // после выполнения отрисовываем в шаблоне блок, что мы отправили запрос
            var user = document.getElementById('friend-' + possible_friend);
            var btnCreate = user.querySelector('.add-friend.one');
            btnCreate.style.display = 'none';
            var status = user.querySelector('.status');
            if (status) {
                status.style.display = 'inline-block';
                var updateStatus = status.querySelector('small');
                updateStatus.innerHTML = 'Запрос на дружбу отправлен';
            } else {
                var p = document.createElement('p');
                var i = document.createElement('i');
                var small = document.createElement('small');
                small.innerHTML = 'Запрос на дружбу отправлен';
                i.appendChild(small);
                p.appendChild(i);
                user.appendChild(p);
            }
        },
    });

}

// функция подтверждения дружбы
function ConfirmationFriend(event) {
    var friend_id = event.target.getAttribute('data-confirmation-friend');
    var request_id = event.target.getAttribute('data-request-id');
    $.ajax({
        url: 'Confirmation/',
        type: 'POST',
        data: {
            friend_id: friend_id, // передаем айди друга
            request_id: request_id // и айди модели дружбы
        },
        success: function () {
            // отрисовываем в шаблоне блок юзера с учетом перехода его в статус "друг"
            var FriendBox = document.getElementById('possible-friend-' + request_id);
            FriendBox.style.display = 'none';
            var user = document.getElementById('friend-' + friend_id);
            var btnDelete = user.querySelector('.delete-friend.one');
            btnDelete.style.display = 'inline-block';
            btnDelete.setAttribute('data-pk-friend', request_id);
            btnDelete.setAttribute('data-friend-user', friend_id);
            var status = user.querySelector('.status');
            var updateStatus = status.querySelector('small');
            updateStatus.innerHTML = 'Ваш друг';
            var clone = user.cloneNode(true);
            clone.setAttribute('id', 'friend-box-' + request_id);
            var statusClone = clone.querySelector('.status');
            statusClone.style.display = 'none';
            var tabs_1 = document.getElementById('tabs-1');
            tabs_1.appendChild(clone);
        }
    });

}

// функция удаления друга
function DeleteFriend(event) {
    var pk_my_obj = event.target.getAttribute('data-pk-friend');
    var friend = event.target.getAttribute('data-friend-user');
    $.ajax({
       url: 'Delete/',
       type: 'POST',
       data: {
           pk_my_obj: pk_my_obj, // передаем айди нашего блока дружбы
           friend: friend // и айди друга
       },
       success: function () {
           // меняем данные в шаблоне в связи с удалением
            var FriendBox = document.getElementById('friend-box-' + pk_my_obj);
            if (FriendBox) {
                FriendBox.style.display = 'none';
            }
            var FriendBoxPossible = document.getElementById('possible-friend-' + pk_my_obj);
            if (FriendBoxPossible) {
                FriendBoxPossible.style.display = 'none';
            }
            var user = document.getElementById('friend-' + friend);
            var btnCreate = user.querySelector('.add-friend.one');
            btnCreate.style.display = 'inline-block';
            var btnDelete = user.querySelector('.delete-friend.one');
            btnDelete.style.display = 'none';
            var status = user.querySelector('.status');
            status.style.display = 'none';
       },
    });

}

// устанавливаем стиль для инпута поиска, когда он в фокусе
document.addEventListener('click', function (event) {
    var search = event.target.className === 'search-input';
    if (search) {
        var parent = event.target.closest('.search');
        parent.setAttribute('style', 'box-shadow: 0 4px 25px #FFFFFF; ');
    } else {
        var parentSRH = document.querySelector('.search');
        parentSRH.removeAttribute('style');
    }
});

