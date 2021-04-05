var scrollFriend = document.getElementById('scrollFriend');
var scrollPeople = document.getElementById('scrollPeople');
var scrollSearch = document.getElementById('scrollSearchResult');

// в каждом блоке беседы есть блок, который должен содежрать количество непрочитанных сообщений в беседе
var chat_unread = document.getElementsByClassName('chat-unread');
for (var c = 0; c < chat_unread.length; c++){
    UnreadCountMessage(chat_unread[c]); // собираем все блоки и передаем на обработку
}

function UnreadCountMessage(chat) {
    var chat_id = chat.getAttribute('data-chat-id'); // извлекаем айди тега, которому будет присвоено число непрочитанных сообщений
    var unread_message = document.getElementById(chat_id);
    var unread = chat.getElementsByClassName('unread'); // извлекаем сообщения
    var sum = 0;
    for (var i = 0; i<unread.length; i++) {
        if (unread[i].innerHTML === 'False'){
            sum += 1; // пресчитываем и записываем их
        }
    }
    unread_message.innerHTML = sum; // выводим число в шаблон
}

// функция создания чата
function SaveChat(event) {
    event.preventDefault();
    var inputPeople = document.querySelectorAll('input[type=checkbox]'); // забераем всех пользователей со страницы
    var arr = [];
    for (var i = 0; i < inputPeople.length; i++) {
        if (inputPeople[i].checked) { // проверяем что юзер отметил пользователя
            var id = inputPeople[i].getAttribute('data-user-id');
            arr.push(id); // добавляем айди юзера в массив
        }
    }
    var uniqueArray = arr.filter(function(item, pos) {
        return arr.indexOf(item) === pos; // отсеиваем повторяющиеся айди, что бы избежать багов в дальнейшем
    });

    if (uniqueArray.length === 1) { // если на выходе одно айди то создаем диалог
        $.ajax({
           url: '/dialogs/',
           type: 'POST',
           data: {
               user_one: uniqueArray[0],
           },
           success: function (data) {
               var chat_id = data.match(/data-chat-id="(.+?)"/); // извлекаем чайт айди после его создания в БД
               var url = document.location.href;
               document.location.href = url + chat_id[1] + '/'; // переводим юзера в беседу
           }
        });
    }else if (uniqueArray.length > 1) { // если больше одного то чат
        $.ajax({
            url: '/dialogs/',
            method: 'POST',
            data: {
                user_all: uniqueArray.join(',')
            },
            success: function(data){
               var chat_id = data.match(/data-chat-id="(.+?)"/);
               var url = document.location.href;
                document.location.href = url + chat_id[1] + '/';
            }
        });
    }
}

var tab = document.querySelectorAll('.tab-label');
for (var i = 0; i < tab.length; i++) {
    tab[i].addEventListener('click', scrollClear);
}


// функция прокрутки списка юзеров в начало при переключении вкладок между ними
function scrollClear() {
    scrollPeople.scrollTo({
        left: 0,
        behavior: "smooth"
    });
    scrollFriend.scrollTo({
        left: 0,
        behavior: "smooth"
    });
}

// функция расчета скорости прокрутки при горизонтальном скролле
function scrollHorizontally(e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        this.scrollLeft -= (delta * 20);
}

function addMouseWell(elem, callback) { //вешает кроссплатформенный обработчик на колесо мыши над элементом
	if (elem.addEventListener) { // в зависмости от браузера вешается свой обработчик
		if ('onwheel' in document) {
			elem.addEventListener("wheel", callback);
		} else if ('onmousewheel' in document) {
			elem.addEventListener("mousewheel", callback);
		} else {
			elem.addEventListener("MozMousePixelScroll", callback);
		}
	} else {
		console.log('не возможно применить скролл');
	}
}

// устанавливаем скролл на все блоки в которых могут находиться юзеры
addMouseWell(scrollFriend, scrollHorizontally);
addMouseWell(scrollPeople, scrollHorizontally);
addMouseWell(scrollSearch, scrollHorizontally);

document.addEventListener('click', function (event) { // устанавливаем задний фон для блока поиска
    var search = event.target.className === 'search-input';
    if (search) {
        var parent = event.target.closest('.search');
        parent.setAttribute('style', 'box-shadow: 0 4px 25px #FFFFFF;');
    } else {
        var parentSRH = document.querySelector('.search');
        parentSRH.removeAttribute('style');
    }
});

// длинна каждого чата и последнего сообщения беседы должна быть ограничена, что бы не съехали стили
var chat_members_list = document.querySelectorAll('.chat-members-list');
for (var q = 0; q < chat_members_list.length; q++) {
    sliceTXTMembers(chat_members_list[q]); // собираем все названия чатов и передаем в обрачотчик
}

var chat_message = document.querySelectorAll('.chat-message');
for (var w = 0; w < chat_message.length; w++) {
    sliceTXT(chat_message[w]); // собираем все последние сообщения бесед
}

// функция обработки длинны сообщения
function sliceTXT(txt) {
    if (txt.innerHTML.length <= 40) { // важно проверять длинну именно по innerHTML, потому что содержание может быть не только текстовым
        txt.innerText === txt.innerText;
    } else {
        var text = txt.innerHTML.replace(/<br>+/g, '');
        if (text.slice(0, 30)[0] === '<') {
            txt.innerText = '~[ вложение ]~';
        } else {
            txt.innerText = txt.innerText.slice(0, 12) + '...';
        }
    }
}

// функция обработки длинны чата
function sliceTXTMembers(txt) {
    if (txt.innerHTML.length <= 400) {
        txt.innerText === txt.innerText;
    } else {
        if (document.querySelector('.chat-label').offsetWidth < 400) {
            txt.innerText = txt.innerText.slice(0, 20) + '...';
        } else {
            txt.innerText = txt.innerText.slice(0, 40) + '...';
        }
    }
}

// функция показа блока с найдеными юзерами после запроса на поиск
function searchResult() {
    $('.tabs').hide(1000);
    setTimeout(function () {
       $('#resultSearch').show(1000);
    }, 1000);

    var inputSearch = document.getElementById('SearchInput');
    var user = inputSearch.getAttribute('data-user');

    if (inputSearch.value !== '') {
        $.ajax({
            url: '/search/Friends/',
            type: 'GET',
            data: {
                num_tab: '3', // поиск осуществляется глобальный, не только по друзьям
                user: user,
                q: inputSearch.value
            },
            success: function (data) {
                scrollSearch.innerHTML = '';
                for (var key in data) { // найденных юзеров мы находим в шаблоне, клонируем и вставляем в блок
                    var boxPeople = document.getElementById('user-' + data[key]['id']);
                    var clone = boxPeople.cloneNode(true);
                    scrollSearch.appendChild(clone);
                }
            }
        });
    } else {
        // в случае случайного нажатия на кнопку поиска выводим сообщение
        scrollSearch.innerHTML = '<h4 style="text-align: center; color: #666666">Задайте парметры поиска</h4>';
    }

}

// функция скрытия блока поиска
function cancelSearch() { // навешивается на кнопку внутри блока
    $('#resultSearch').hide(1000);
    setTimeout(function () {
       $('.tabs').show(1000);
    }, 1000);
}

// функция активации анимации при создание беседы
$('#CreateChat').click(function () {
    if (document.querySelector('.chat-label').offsetWidth < 400) {
        $('.checkPeople').css({transition:'2s', 'display':'inline'});
        $('.allPeopleBox').css({transition:'2s', 'margin-right':'10%'});
    } else {
        $('.checkPeople').css({transition:'2s', 'display':'inline'});
        $('.allPeopleBox').css({transition:'2s', 'margin-right':'3%'});
    }
   $(this).fadeOut(1000);
   setTimeout(function () {
        $('#SaveChat').fadeIn(1000);
        $('#CancelChat').fadeIn(1000);
   }, 1000);
});

// функция активации анимации при отказе от создания беседы
$('#CancelChat').click(function () {
   $('.checkPeople').css({transition:'2s', 'display':'none'});
   $('.allPeopleBox').css({transition:'2s', 'margin-right':'2%'});
   $(this).fadeOut(1000);
   $('#SaveChat').fadeOut(1000);
   setTimeout(function () {
        $('#CreateChat').fadeIn(1000);
   }, 1000);
});