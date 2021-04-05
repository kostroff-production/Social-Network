var emoji_box = document.getElementById('emoji-box');
emoji_box.addEventListener('click', change);
var emoji_scroll_div = emoji_box.querySelector('.emoji-mart-scroll');
emoji_scroll_div.addEventListener('scroll', ScrollElem);
emoji_scroll_div.addEventListener('mouseover', takeEmoji);
var input_message = document.getElementById('message_id div');
var btnSelectedAll = emoji_box.querySelectorAll('.emoji-mart-anchor');
var select_category = emoji_box.querySelectorAll('.emoji-mart-category');

// функция активации категорий при переключении их
function change(event) {
    var targ = event.target;
    var btnSelect = targ.closest('.emoji-mart-anchor');
    if (btnSelect) { // проверяем, что мы жмем на раздел
        for (var i = 0; i < btnSelectedAll.length; i++) { // снимаем селекты со всех категорий
            btnSelectedAll[i].classList.remove('emoji-mart-anchor-selected');
            btnSelectedAll[i].removeAttribute('style');
        }
        var title = btnSelect.getAttribute('title');
        btnSelect.classList.add('emoji-mart-anchor-selected'); // устанавливаем селект на старгетированную категорию
        btnSelect.style.color = "#0176FF"; // меняем цвет
        ShowEmoji(title); // активируем функцию показа содержимого категории
    }
}

// функция показа содержимого категории
function ShowEmoji(title) {
    for (var i = 0; i<select_category.length; i++) {
        if (select_category[i].getAttribute('aria-label') === title) {
            emoji_scroll_div.scrollTop = select_category[i].offsetTop; // пролистываем содержимое категории до верней границы блока эмоджи
        }
    }
}

// функция смены селекта категорий при скролле внутри блока эмоджи
function ScrollElem() {
    for (var i = 0; i < select_category.length; i++) {
        // проверяем прошел ли блок с содержимым категории, верхнюю границу блока эмоджи
        if (emoji_scroll_div.scrollTop >= select_category[i].offsetTop) { // если проходит
            for (var e = 0; e < btnSelectedAll.length; e++) {
                btnSelectedAll[e].classList.remove('emoji-mart-anchor-selected');
                btnSelectedAll[e].removeAttribute('style');
                var label = select_category[i].getAttribute('aria-label');
                if (btnSelectedAll[e].getAttribute('aria-label') === label) { // устанавливаем селекты на иконку категории
                    btnSelectedAll[e].classList.add('emoji-mart-anchor-selected');
                    btnSelectedAll[e].style.color = "#0176FF";
                }
            }
        }
    }
}

// функция захвата смайла
function takeEmoji(event) {
    event.preventDefault();
    var emoji_targ = event.target;
    var emoji_span = emoji_targ.closest('.emoji-mart-emoji');
    if (emoji_span){
        emoji_span.addEventListener('click', showEmojiEvent); // на выбранный смайл навешиваем функцию передачи смайла в инпут
    }
}

var input_re_post = document.getElementById('message-re-post');
var input_comment_base = document.getElementById('input-comment-base');
var input_post;
var input_comment;
var id_content;

// функция передачи смайла из блока эмоджи в инпут
function showEmojiEvent () {
    var select = window.getSelection();
    // проверяем в какой именно инпут нам нужно передать смайл
    // это зависит это того в каком разделе соц сети мы находимся
    if (input_message) {
        // добавляем эмоджи к имеющемуся тексту и в конце добавляем пробел, потому что эмоджи в спэне и это вызывает проблемы при переводе каретки в конец строки в ручную
        input_message.innerHTML = input_message.innerHTML + this.innerHTML + '&nbsp';
        input_message.focus(); // активируем фокус на инпуте
        select.selectAllChildren(input_message);
        select.collapseToEnd(); // переводим каретку в конец строки
    } else if (input_comment) {
        input_comment.innerHTML = input_comment.innerHTML + this.innerHTML + '&nbsp';
        select.selectAllChildren(input_comment);
        select.collapseToEnd();
    } else if (input_comment_base) {
        input_comment_base.innerHTML = input_comment_base.innerHTML + this.innerHTML + '&nbsp';
        select.selectAllChildren(input_comment_base);
        select.collapseToEnd();
    } else if (input_post) {
        input_post.innerHTML = input_post.innerHTML + this.innerHTML + '&nbsp';
        select.selectAllChildren(input_post);
        select.collapseToEnd();
    } else if (input_re_post) {
        input_re_post.innerHTML = input_re_post.innerHTML + this.innerHTML + '&nbsp';
        select.selectAllChildren(input_re_post);
        select.collapseToEnd();
    }
}

window.addEventListener('click', clickWindowEmoji); // на окно навешиваем функцию активации блока эмоджи
var comment_list = document.querySelector('.comment-list');
var block_emoji = document.getElementById('block-emoji');

// функция активации блока эмоджи
function clickWindowEmoji(event) {
    var box_base = event.target.closest('.emoji-box-base');
    var answer = event.target.closest('.answer');
    // так как эмоджи работают в разных разделах соц сети, то мы проверяем от куда идет
    // вызов блока эмоджи и подгоняем расположение блока исходя из этого
    if (answer) { // если вызов идет в нутри пулла с комментариями
        id_content = answer.querySelector('#id_content');
        input_comment = answer.querySelector('.input-comment');
    }
    if (event.target.closest('.block-emoji')) { // если мы таргетируем внутри самого блока эмоджи
        block_emoji.style.display = 'block';
    // ниже проверяются таргеты расположенные в различных блоках соц сети
    // задать всем кнопкам вызова один класс проблематично, потому что показ блока эмоджи будет отличаться
    } else if (event.target.closest('.emoji-box-base')) {
        toggleEmojiBox();
        if (event.target.closest('.comment-list')) {
            if (box_base.offsetTop - 10 - block_emoji.offsetHeight - comment_list.scrollTop < 0) {
                block_emoji.style.top = box_base.offsetTop + 30 - comment_list.scrollTop + 'px';
                block_emoji.style.left = box_base.offsetLeft - (block_emoji.offsetWidth / 2) - 70 + 'px';
            } else {
                block_emoji.style.top = box_base.offsetTop - 10 - block_emoji.offsetHeight - comment_list.scrollTop + 'px';
                block_emoji.style.left = box_base.offsetLeft - (block_emoji.offsetWidth / 2) - 70 + 'px';
            }
        } else if (event.target.closest('.bi-input-base')) {
            input_post = document.getElementById('form_input_post');
            if (input_post.offsetWidth > 420) {
                if (box_base.offsetLeft < 170) {
                    block_emoji.style.top = box_base.offsetTop + (block_emoji.offsetWidth / 2) - 25 + 'px';
                    block_emoji.style.left = box_base.offsetLeft + (block_emoji.offsetWidth * 2) + 10 + 'px';
                } else {
                    block_emoji.style.top = box_base.offsetTop + block_emoji.offsetWidth + 30 + 'px';
                    block_emoji.style.left = box_base.offsetLeft + block_emoji.offsetWidth + 'px';
                }
            } else {
                block_emoji.style.top = window.pageYOffset + 50 + 'px';
                block_emoji.style.left = 10 + 'px';
            }
        } else if (event.target.closest('.person-page')) {
            input_post = null;
            block_emoji.style.top = box_base.offsetTop + block_emoji.offsetHeight - 40 + 'px';
            block_emoji.style.left = box_base.offsetLeft + (block_emoji.offsetWidth) + 45 + 'px';
        } else {
            if (box_base.offsetTop - 10 - block_emoji.offsetHeight < 0) {
                block_emoji.style.top = box_base.offsetTop + 30 + 'px';
                block_emoji.style.left = box_base.offsetLeft + 25 + 'px';
            } else {
                block_emoji.style.top = box_base.offsetTop - 10 - block_emoji.offsetHeight + 'px';
                block_emoji.style.left = box_base.offsetLeft - (block_emoji.offsetWidth / 2) - 70 + 'px';
            }
        }
    } else {
       hideEmojiBox(); // в случае если клик был ни по одному из блоков, вызывается функция скрытия блока эмоджи
   }
}

var box = $('#block-emoji');
function toggleEmojiBox() { // функция активации и деактивации блока
    box.fadeToggle(500);
}

function hideEmojiBox() { //  функция деактивации блока
    box.fadeOut(500);
}


