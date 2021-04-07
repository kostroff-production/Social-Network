
// функция зацикливания и начала отправки запросов на сервер
function start() {
    setInterval(UnreadMessages, 3000);
    UnreadMessages();

    setInterval(PossibleFriends, 5000);
    PossibleFriends();
}

// функция расчета непрочитанных сообщений
function UnreadMessages() {
    var unread_messages = document.getElementById('unread_messages');
    var unread_messages_media = document.getElementById('unread_messages-media');
    $.ajax({
        url: '/unreadMessages/',
        type: 'GET',
        success: function (data) {
            if (data.length > 0) { // проверяем, что бы непрочитанные сообщения были
                unread_messages.style.display = 'inline-block';
                unread_messages.innerHTML = data.length;
                unread_messages_media.style.display = 'inline-block';
                unread_messages_media.innerHTML = data.length;
            } else {
                unread_messages.style.display = 'none';
                unread_messages_media.style.display = 'none';
            }
        }
    });
}

// функция расчета запросов на дружбу
function PossibleFriends() {
    var possible_friends = document.querySelectorAll('.badge.count__possible_friends');
    $.ajax({
        url: '/possibleFriends/',
        type: 'GET',
        success: function (data) {
            if (data.length > 0) { // проверяем, что бы запросы были
                for (var i = 0; i < possible_friends.length; i++) {
                    possible_friends[i].style.display = 'inline-block';
                    possible_friends[i].innerHTML = data.length;
                }
            } else {
                for (var i = 0; i < possible_friends.length; i++) {
                    possible_friends[i].style.display = 'none';
                }
            }
        }
    });
}

window.onload = start(); // активируем функцию при загрузке окна
