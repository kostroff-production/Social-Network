var input_comment_base = document.getElementById('input-comment-base');

// функция показа инпута для ввода сообщения в пулле комментариев
function linkComm(event) {
    var comment = event.target.closest('.comment-block');
    var Hide = comment.getAttribute('data-text-hide'); // текст при показе инпута
    var Show = comment.getAttribute('data-text-show'); // текст при скрытом инпуте
    var data_id = comment.getAttribute('data-name');
    var answer = document.getElementById(data_id); // блок с инпутом, который будем показывать
    var input_comment = answer.querySelector('div.input-comment');
    var btn_update = answer.querySelector('.btn-update-comment');
    var btn_create = answer.querySelector('.btn-comment-form');
   if (comment.innerHTML === Hide) {
       comment.innerHTML = Show;
       answer.style.display = 'block';
   } else {
        comment.innerHTML = Hide;
        answer.style.display = 'none';
        input_comment.innerHTML = ''; // в отказа от комментирования очищаем инпут
        btn_update.style.display = 'none';
        btn_create.style.display = 'inline-block';
        answer.removeAttribute('data-update');
   }
}

// функция пролистывания пулла с комментариями
function scrollCommentList () {
    list_comment.scrollTo({ // пулл пролистывается если комментарий был написан через главный инпут
        top: list_comment.scrollHeight,
        behavior: "smooth"
    });
}

document.addEventListener('click', function (event) { // накладываем тень если инпут в фокусе
   var target = event.target;
   var comment_form = document.getElementById('comment-form');
   if (target === input_comment_base) {
       comment_form.setAttribute('style', 'box-shadow: 0 0 25px #666666; transition: 0.5s;');
   } else {
       comment_form.removeAttribute('style');
   }
});

// функция создания комментария
function CreateComment(event) {
    var answer = event.target.closest('.answer');
    var comment_form = event.target.closest('.comment-form');
    if (answer) { // если мы хотим комментировать чей-то комментарий из пулла
        if (answer.hasAttribute('data-update') === false) { // наличие аттрибута сообщает о том, что комментарий будет редактирован
            var parent_id = answer.querySelector('input[name="parent_id"]');
            var input_comment = answer.querySelector('.input-comment');
            var str = input_comment.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim(); // очищаем строку комментария от лишних пробелов и тегов
            var card_p_3 = event.target.closest('.card.p-3');
            var comment_block = card_p_3.querySelector('a.comment-block');
            var Hide = comment_block.getAttribute('data-text-hide');
            if (str !== '') { // проверяем, что бы строка была не пустая
                if (event.keyCode === 13) { // комментарий создает при нажатии на enter
                    $.ajax({
                        type: 'POST',
                        data: {
                            content: str,
                            parent_id: parent_id.value // передаем значение родительского комментария
                        },
                        success: function () {
                            input_comment.innerHTML = '';
                            answer.style.display = 'none';
                            comment_block.innerHTML = Hide;
                            RequestComment(); // активируем функцию добавления нового комментария в пулл
                        },
                    });
                } else if (event.target.closest('.btn-comment-form')) { // комментарий создается при нажатии на кнопку создания в окне инпута
                    $.ajax({
                        type: 'POST',
                        data: {
                            content: str,
                            parent_id: parent_id.value
                        },
                        success: function () {
                            input_comment.innerHTML = '';
                            answer.style.display = 'none';
                            comment_block.innerHTML = Hide;
                            RequestComment();
                        },
                    });
                }
            }
        }
    } else if (comment_form) { // если мы создаем новый комментарий через главный инпут
        var str_base = input_comment_base.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim();
        if (str_base !== '') {
            if (event.keyCode === 13) {
                $.ajax({
                    type: 'POST',
                    data: {
                        content: str_base,
                    },
                    success: function () {
                        input_comment_base.innerHTML = '';
                        RequestComment();
                    },
                });
            } else if (event.target.closest('.btn-comment-form')) {
                $.ajax({
                    type: 'POST',
                    data: {
                        content: str_base,
                    },
                    success: function () {
                        input_comment_base.innerHTML = '';
                        RequestComment();
                    },
                });
            }
        }
    }
}

// функция подготовки комментария к обновлению
function UpdateComment(event) {
    var card_p_3 = event.target.closest('.card.p-3');
    var comment = card_p_3.querySelector('.panel-change-comment .comment p');
    var input_comment = card_p_3.querySelector('div.answer div.input-comment');
    input_comment.addEventListener('keyup', requestUpdateComment); // подключаем функцию обновления комментария при нажатии на enter
    var comment_block = card_p_3.querySelector('a.comment-block');
    var Show = comment_block.getAttribute('data-text-show');
    var data_id = comment_block.getAttribute('data-name');
    var answer = document.getElementById(data_id); // так же находим блок с инпутом в пулле
    answer.setAttribute('data-update', 'True');
    var btn_update = card_p_3.querySelector('div.answer .btn-update-comment');
    btn_update.style.display = 'inline-block';
    btn_update.addEventListener('click', requestUpdateComment); // подключаем функцию обновления комментария при нажатии на кнопку в инпут блоке
    var btn_create = card_p_3.querySelector('div.answer .btn-comment-form');
    btn_create.style.display = 'none';
    comment_block.innerHTML = Show;
    answer.style.display = 'block';
    input_comment.innerHTML = comment.innerHTML + '&nbsp;'; // подтсавляем текс в инпут, добавляем пробел на случай если в комментарии последним символом был смайл
    input_comment.focus(); // устанавливаем фокус на инпуте с текстом
    var select = window.getSelection();
    select.selectAllChildren(input_comment);
    select.collapseToEnd(); // переводим курсор фокуса в конец сроки
}

// функция обновления комментария
function requestUpdateComment(event) {
    var answer = event.target.closest('.answer');
    if (answer.hasAttribute('data-update')) { // проверяем наличие атрибута
        var card_p_3 = event.target.closest('.card.p-3');
        var comment_block = card_p_3.querySelector('a.comment-block');
        var Hide = comment_block.getAttribute('data-text-hide');
        var comment = card_p_3.querySelector('.panel-change-comment .comment p');
        var input_comment = card_p_3.querySelector('div.answer div.input-comment');
        var id_comment = answer.getAttribute('id');
        var btn_update = card_p_3.querySelector('div.answer .btn-update-comment');
        var btn_create = card_p_3.querySelector('div.answer .btn-comment-form');
        var str = input_comment.innerHTML.replace(/&nbsp;+|<div>+|<\/div>+|<br>+/g, ' ').trim();
        if (str !== '') {
            if (answer && event.keyCode === 13) {
                $.ajax({
                    url: 'Update/',
                    type: 'POST',
                    data: {
                        old_comment: comment.innerHTML,
                        content: str,
                        id_comment: id_comment
                    },
                    success: function () {
                        answer.style.display = 'none';
                        comment_block.innerHTML = Hide;
                        comment.innerHTML = str;
                        input_comment.innerHTML = '';
                        btn_update.style.display = 'none';
                        btn_create.style.display = 'inline-block';
                        answer.removeAttribute('data-update');
                    }
                });
            }

            if (event.target.closest('.btn-update-comment')) {
                $.ajax({
                    url: 'Update/',
                    type: 'POST',
                    data: {
                        old_comment: comment.innerHTML,
                        content: str,
                        id_comment: id_comment
                    },
                    success: function () {
                        answer.style.display = 'none';
                        comment_block.innerHTML = Hide;
                        comment.innerHTML = str;
                        input_comment.innerHTML = '';
                        btn_update.style.display = 'none';
                        btn_create.style.display = 'inline-block';
                        answer.removeAttribute('data-update');
                    }
                });
            }
        } else {
            answer.style.display = 'none';
            comment_block.innerHTML = Hide;
            input_comment.innerHTML = '';
            btn_update.style.display = 'none';
            btn_create.style.display = 'inline-block';
            answer.removeAttribute('data-update');
        }
    }
}

// функция удаления комментария
function DeleteComment(event) { // функция навешивается на кнопку удаления в шаблоне
    var card_p_3 = event.target.closest('.card.p-3'); // находим родителя
    var id_comment = card_p_3.getAttribute('id'); // забираем айди комментария
    $.ajax({
       url: '/Comment/Delete/',
       type: 'POST',
       data: {
           id_obj: id_comment.replace(/\S+-/, '') // оставляем только числовое значение айди комментария
       },
       success: function () {
           card_p_3.style.display = 'none'; // скрываем комментарий после удаления
       }
    });
}

var list_comment = document.querySelector('.comment-list');
var parent_comment_div;
var type;
var obj_id;

// функция определения какой тип объекта комментируется и его айди
function getUrl() {
    var url = document.location.href.match(/.+\/\/.+\/.+\/(\d+)\/(\w+)\/.+/); // забераем все данные с адресной строки
    obj_id = url[1];
    type = url[2];
}

window.onload = getUrl(); // функция активируется сразу после загрузки окна

// функция добавления нового комментария в шаблон
function RequestComment() {
    // забираем шаблоны
    var parent = document.getElementById('parent'); // комментария родителя
    var children = document.getElementById('children'); // и дочернего комментария
    $.ajax({
        url: '/requestComment/' + type + '/', // подставляем тип объекта
        type: 'GET',
        data: {
            obj_id: obj_id // передаем айди объекта
        },
        success: function (data) {
            var clone;
            var a;
            var p;
            var comment_block;
            var answer;
            var parent_id;
            // после получения ответа от сервера подставляем все данные нового комментария в шаблон
            if (data[0].parent) { // проверяем был ли у комментария родитель
               clone = children.cloneNode(true); // если был то клонируем шаблон дочернего
               clone.style.display = 'block';
               clone.setAttribute('id', 'comment-' + data[0].id);
               a = clone.querySelector('.text-muted a');
               a.href = '/paren/' + data[0]['user'].slug + '/';
               a.innerHTML = data[0]['user'].first_name + ' ' + data[0]['user'].last_name;
               p = clone.querySelector('.comment p');
               p.innerHTML = data[0].content;
               comment_block = clone.querySelector('.comment-block');
               comment_block.setAttribute('data-name', data[0].id);
               answer = clone.querySelector('.answer');
               answer.setAttribute('id', data[0].id);
               answer.setAttribute('data-slug', data[0].slug);
               parent_id = clone.querySelector('.parent_id');
               parent_id.value = data[0]['parent'].id;
               parent_comment_div = document.getElementById('parent-comment-' + data[0]['parent'].id); // забераем родительские коммент из пулла
               parent_comment_div.appendChild(clone); // добавляем ему в конец новый коммент
            } else {
                clone = parent.cloneNode(true); // если родителя не было то работаем с родительским комментарием
                clone.removeAttribute('style');
                clone.setAttribute('id', 'comment-' + data[0].id);
                a = clone.querySelector('.text-muted a');
                a.href = '/paren/' + data[0]['user'].slug + '/';
                a.innerHTML = data[0]['user'].first_name + ' ' + data[0]['user'].last_name;
                p = clone.querySelector('.comment p');
                p.innerHTML = data[0].content;
                comment_block = clone.querySelector('.comment-block');
                comment_block.setAttribute('data-name', data[0].id);
                answer = clone.querySelector('.answer');
                answer.setAttribute('id', data[0].id);
                answer.setAttribute('data-slug', data[0].slug);
                parent_id = clone.querySelector('.parent_id');
                parent_id.value = data[0].id;
                var div = document.createElement('div'); //создаем вокруг родителя блок в котром будет находиться он и его дочки
                div.setAttribute('id', 'parent-comment-' + data[0].id); // присваиваем айди
                div.appendChild(clone); // добавляем родителя в блок
                list_comment.appendChild(div); // добавляем все в список комментариев
                scrollCommentList(); // вызываем функцию пролистывания пулла
            }
        }
    });
}


