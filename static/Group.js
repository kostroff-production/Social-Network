var tabs = document.getElementById('tabs');

// функция показа всплывающего меню
function showMenu(event) {
    var parent = event.target.closest('.group');
    var menu = parent.querySelector('.drop-menu');
    var btn = parent.querySelector('.group-body.menu');

    menu.classList.toggle('full');
    if (parent.offsetWidth > 400) {
        menu.style.top = btn.offsetTop - (menu.offsetHeight / 3) + 'px';
        menu.style.left = btn.offsetLeft - (menu.offsetWidth / 2) - 20 + 'px';
    } else {
        menu.style.top = btn.offsetTop - (menu.offsetHeight / 3) + 'px';
        menu.style.left = btn.offsetLeft - (menu.offsetWidth / 2) - 80 + 'px';
    }

}

// функция смены кнопки на "отписаться"
function pushSubscribe(event) {
    var parent;
    // проверяем где было нажатие, в списке групп или уже в detail группы
    if (event.target.closest('.drop-menu')) {
        parent = event.target.closest('.drop-menu');
    } else if (event.target.closest('.group-menu')) {
        parent = event.target.closest('.group-menu');
    }
    var subscribe = parent.querySelector('.subscribe');
    var unsubscribe = parent.querySelector('.unsubscribe');

    showSubscribe();
    parent.classList.toggle('full'); // по нажатию добавляем или убираем стили
    subscribe.style.display = 'none';
    unsubscribe.style.display = 'block';
}

// функция смены кнопки на "подписаться"
function pushUnsubscribe(event) {
    var parent;
    if (event.target.closest('.drop-menu')) {
        parent = event.target.closest('.drop-menu');
    } else if (event.target.closest('.group-menu')) {
        parent = event.target.closest('.group-menu');
    }
    var subscribe = parent.querySelector('.subscribe');
    var unsubscribe = parent.querySelector('.unsubscribe');

    showUnsubscribe();
    parent.classList.toggle('full');
    subscribe.style.display = 'block';
    unsubscribe.style.display = 'none';
}

// активируем всплвыющие окна после нажатия кнокпок "подписаться" или "отписаться"

var divSubscribe = $('#backgroundDivSubscribe');
var divUnsubscribe = $('#backgroundDivUnsubscribe');

function showSubscribe() {
    divSubscribe.fadeIn(800);
    setTimeout(function () {
       divSubscribe.fadeOut(800);
    }, 800);
}

function showUnsubscribe() {
    divUnsubscribe.fadeIn(800);
    setTimeout(function () {
        divUnsubscribe.fadeOut(800);
    }, 800);
}

var search_input = document.querySelector('.search-input');
var tab_txt;
if (tabs) {
    createTabs(tabs);
}

// функция показа групп в зависмости от выбранной вкладки
function createTabs(root) {
    var items = root.getElementsByClassName('tabs__item'); // забираем вкладки
    var texts = root.getElementsByClassName('tabs__text'); // забираем содержимое блоков
    root.addEventListener('click', sliderGroups); // на таблицу невешиваем функцию показа блоков
    function sliderGroups(event) {
        var targ = event.target;
        if (targ.tagName !== 'LI') return;
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('select'); // очищаем все селекты
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
            search_input.placeholder = 'Поиск среди подписанных....';
        } else if (num_tab === '2') {
            search_input.placeholder = 'Поиск среди всех....';
        } else if (num_tab === '3') {
            search_input.placeholder = 'Поиск среди своих....';
        }
    }
}

// анимация показа содержимого вкладки
function showTxt() {
    tab_txt.fadeIn(900);
}

var formGroup = document.getElementById('FormGroup');
var backgroundDiv = document.getElementById('backgroundDivRePost');
var id_name = document.getElementById('id_name');
var description = document.getElementById('descriptionGroup');
var baseDes = document.getElementById('id_description');

// функция закрытия формы создания группы
function cancelFormGroup() { // очищаем все данные формы
    backgroundDiv.style.display = 'none';
    formGroup.style.display = 'none';
    id_name.value = null;
    description.innerHTML = '';
    baseDes.innerHTML = '';
}

// функция подстановки описания группы в скрытый базовый инпут формы
function copyText() {
    baseDes.innerHTML = description.innerHTML;
}

// фукция показа окна формы создания группы
function showFormGroup() {
    formGroup.style.display = 'block'; // показ формы
    backgroundDiv.style.display = 'block'; // активация затемнения заднего фона
}

// функция активации подписки на группу
function createFollowers(event) {
    var parent;
    var text;
    if (event.target.closest('.group')) {
        parent = event.target.closest('.group');
        text = parent.querySelector('.text');
    } else if (event.target.closest('.group-head')) {
        parent = event.target.closest('.group-head');
        text = parent.querySelector('.text.txt');
    }
    var pk = text.getAttribute('data-pk');
    var followers = parent.querySelector('.group-followers');
    $.ajax({
        url: '/followers/create/',
        type: 'GET',
        data: {
            key: 1,
            pk: pk
        },
        success: function (data) {
            followers.innerHTML = 'Подписчиков: ' + data[0].followers.length; // меняем колличество подписчиков в шаблоне
        }
    });
}

// функция отписки от группы
function removeFollowers(event) {
    var parent;
    var text;
    if (event.target.closest('.group')) {
        parent = event.target.closest('.group');
        text = parent.querySelector('.text');
    } else if (event.target.closest('.group-head')) {
        parent = event.target.closest('.group-head');
        text = parent.querySelector('.text.txt');
    }
    var pk = text.getAttribute('data-pk');
    var followers = parent.querySelector('.group-followers');
    $.ajax({
        url: '/followers/delete/',
        type: 'GET',
        data: {
            key: 2,
            pk: pk
        },
        success: function (data) {
            followers.innerHTML = 'Подписчиков: ' + data[0].followers.length;
        }
    });
}

// функция поиска групп
function searchResult() {
    var item = tabs.querySelector('.tabs__item.select');
    var texts = tabs.querySelectorAll('.tabs__text');

    for (var e = 0; e < texts.length; e++) { // скрываем данные блоков
            texts[e].style.display = 'none';
    }
    var num_tab = item.getAttribute('data-id').replace(/\w+-/, ''); // забираем числовое значение селекта
    var tab_search = document.getElementById('tabs-search');
    var user = search_input.getAttribute('data-user');
    tab_search.innerHTML = ''; // очищаем блок показывающий найденные группы
    showSearch(); // запускаем анимацию показа найденных групп

    if (search_input.value !== '') { // проверяем, что бы запрос был не пустым
        $.ajax({
            url: '/search/Groups/',
            type: 'GET',
            data: {
                num_tab: num_tab, // передаем ключ области поиска
                user: user, // у кого ищем
                q: search_input.value // что ищем
            },
            success: function (data) {
                var group;
                var clone;
                // в зависимости от области поиска, находим группу в шаблоне, клонируем и выводим на экран
                if (num_tab === '1') {
                    for (var key1 in data) {
                        group = document.getElementById('group-' + data[key1].id);
                        if (group) {
                            clone = group.cloneNode(true);
                            tab_search.appendChild(clone);
                        }
                    }
                } else if (num_tab === '2') {
                    for (var key2 in data) {
                        group = document.getElementById('group-' + data[key2].id);
                        if (group) {
                            clone = group.cloneNode(true);
                            tab_search.appendChild(clone);
                        }
                    }
                } else if (num_tab === '3') {
                    for (var key3 in data) {
                        group = document.getElementById('group-' + data[key3].id);
                        if (group) {
                            clone = group.cloneNode(true);
                            tab_search.appendChild(clone);
                        }
                    }
                }
            }
        });
    } else { // если запрос пустой то выводим сообщение
        tab_search.innerHTML = '<h3 style="text-align: center">Задайте параметры поиска</h3>';
    }

}

// функция анимированного вывода найденных групп
var tabs_search = $('#tabs-search');
function showSearch() {
    tabs_search.slideDown(500);
}

var baseBar = document.querySelector('.group-head');
var scrollBar = document.querySelector('.group-head.scroll');
var btnScroll = document.querySelector('.scrollTop-btn');
var Posts = document.getElementById('Posts');

if (btnScroll) { // активируем кнопку прокрутки страницы
    btnScroll.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        Posts.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// навешиваем на окно функции показа кнокпи прокрутки страницы, в зависимости от высоты прокрутки
window.addEventListener('scroll', function () {
    // ширина блоков "постов" в зависимости от устройста (ПК или мобильный телефон)
    if (Posts.offsetWidth > 600) {
        if (pageYOffset > 200) { // активируем кнопку если она пройдет высоту в 200 пикселей
            baseBar.style.display = 'none';
            scrollBar.style.display = 'block';
            btnScroll.style.display = 'block';
        } else {
            baseBar.style.display = 'block';
            scrollBar.style.display = 'none';
            btnScroll.style.display = 'none';
        }
    } else {
        if (pageYOffset > 1000) {
            btnScroll.style.display = 'block';
            btnScroll.style.top = 0;
        } else {
            btnScroll.style.display = 'none';
        }
    }
});