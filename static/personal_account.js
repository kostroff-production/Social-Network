var btn = document.querySelector('.scrollTop-btn');
var left = document.getElementById('Left-position');
var right = document.getElementById('Posts');

// навешиваем функцию прокрутки окна, на кнопку прокрутки
btn.addEventListener('click', function () {
    left.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    right.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// устанавливаем позиционирование кнопки в зависимости от размера экрана
window.addEventListener('scroll', function () {
    if (left.offsetWidth > 385) {
        if (pageYOffset > 800) {
            btn.style.display = 'block';
            position();
        } else if (pageYOffset < 800) {
            btn.style.display = 'none';
            btn.style.marginTop = 0;
            btn.style.marginLeft = 0;
        }
    } else {
        if (pageYOffset > 800) {
            btn.style.display = 'block';
        } else if (pageYOffset < 800) {
            btn.style.display = 'none';
        }
    }
});

var body = document.body;

function position() { // функция позиционирования кнопки
    btn.style.marginTop = (body.offsetHeight - btn.offsetHeight) / 4 + 'px';
}

// функция активации полноэкранного режима показа аватара
var form_avatar = document.querySelector('.form-avatar');
form_avatar.addEventListener('click', function () {
    if (left.offsetWidth > 385) { // доступна только на большом экране
        this.classList.toggle('full');
        var image = this.querySelector('img');
        image.style.top = (body.offsetHeight - image.offsetHeight) / 8 + 'px';
        image.style.left = (body.offsetWidth - image.offsetWidth) / 2 + 'px';
    }
});

// функция отправки заявки на дружбу, если мы на старице стороннего пользователя
function SendingToAdd(event) {
    var possible_friend = event.target.getAttribute('data-user');
    var slug = event.target.getAttribute('data-slug');
    $.ajax({
        url: '/person/' + slug + '/Friends/Create/',
        type: 'POST',
        data: {
            possible_friend: possible_friend,
        },
        success: function () {
            event.target.style.display = 'none';
            var status_box = document.querySelector('.status-user-box');
            var p = document.createElement('p');
            var i = document.createElement('i');
            var small = document.createElement('small');
            small.innerHTML = 'Запрос на дружбу отправлен';
            i.appendChild(small);
            p.appendChild(i);
            status_box.appendChild(p);
        },
    });
}

// функция удаления из друзей, если мы на странице стороннего пользователя
function DeleteFriend(event) {
    var pk_my_obj = event.target.getAttribute('data-pk-friend');
    var friend = event.target.getAttribute('data-friend-user');
    var slug = event.target.getAttribute('data-slug');
    $.ajax({
       url: '/person/' + slug + '/Friends/Delete/',
       type: 'POST',
       data: {
           pk_my_obj: pk_my_obj,
           friend: friend
       },
       success: function () {
            event.target.style.display = 'none';
            var status_user = document.querySelector('.status-user');
            status_user.style.display = 'none';
            var btnAddFriend = document.getElementById('bntAddFriend');
            btnAddFriend.style.display = 'block';
       },
    });

}