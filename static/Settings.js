
// функция изменения настроек приватности страницы
function changeSettings(event) {
    var target = event.target;
    var parent;
    var checkbox;
    var listFriendsChecked;
    var btnUpdate;
    var checkboxFriend;
    var checkActivateFriend;

    // проверяем область изменения
    if (target.closest('.all')) {
        parent = target.closest('.all');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var i = 0; i < checkbox.length; i++) { // сбрасываем прошло значение области
            checkbox[i].checked = false;
        }
        target.checked = true; // активируем выбранное
        parent.setAttribute('data-permission', target.value);
    } else if (target.closest('.photo')) {
        parent = target.closest('.photo');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var e = 0; e < checkbox.length - 1; e++) {
            checkbox[e].checked = false;
        }
        target.checked = true;
        parent.setAttribute('data-permission', target.value);
        // при изменение на параметр "Видно всем" сбрасываем все прошлые настройки шаблона
        if (target.value === 'Видно всем') {
            listFriendsChecked = parent.querySelector('.list-check-user');
            btnUpdate = parent.querySelector('.btn-settings.update');
            listFriendsChecked.innerHTML = '';
            btnUpdate.style.display = 'none';
            checkActivateFriend = parent.querySelector('.checkbox-permission.friend');
            checkboxFriend = parent.querySelectorAll('.hidden-friend-checkbox');
            for (var q = 0; q < checkboxFriend.length; q++) {
                checkboxFriend[q].checked = false;
            }
            checkActivateFriend.checked = false;
        }
    } else if (target.closest('.audios')) {
        parent = target.closest('.audios');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var a = 0; a < checkbox.length - 1; a++) {
            checkbox[a].checked = false;
        }
        target.checked = true;
        parent.setAttribute('data-permission', target.value);
        if (target.value === 'Видно всем') {
            listFriendsChecked = parent.querySelector('.list-check-user');
            btnUpdate = parent.querySelector('.btn-settings.update');
            listFriendsChecked.innerHTML = '';
            btnUpdate.style.display = 'none';
            checkActivateFriend = parent.querySelector('.checkbox-permission.friend');
            checkboxFriend = parent.querySelectorAll('.hidden-friend-checkbox');
            for (var w = 0; w < checkboxFriend.length; w++) {
                checkboxFriend[w].checked = false;
            }
            checkActivateFriend.checked = false;
        }
    } else if (target.closest('.video')) {
        parent = target.closest('.video');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var v = 0; v < checkbox.length - 1; v++) {
            checkbox[v].checked = false;
        }
        target.checked = true;
        parent.setAttribute('data-permission', target.value);
        if (target.value === 'Видно всем') {
            listFriendsChecked = parent.querySelector('.list-check-user');
            btnUpdate = parent.querySelector('.btn-settings.update');
            listFriendsChecked.innerHTML = '';
            btnUpdate.style.display = 'none';
            checkActivateFriend = parent.querySelector('.checkbox-permission.friend');
            checkboxFriend = parent.querySelectorAll('.hidden-friend-checkbox');
            for (var r = 0; r < checkboxFriend.length; r++) {
                checkboxFriend[r].checked = false;
            }
            checkActivateFriend.checked = false;
        }
    } else if (target.closest('.group')) {
        parent = target.closest('.group');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var g = 0; g < checkbox.length - 1; g++) {
            checkbox[g].checked = false;
        }
        target.checked = true;
        parent.setAttribute('data-permission', target.value);
        if (target.value === 'Видно всем') {
            listFriendsChecked = parent.querySelector('.list-check-user');
            btnUpdate = parent.querySelector('.btn-settings.update');
            listFriendsChecked.innerHTML = '';
            btnUpdate.style.display = 'none';
            checkActivateFriend = parent.querySelector('.checkbox-permission.friend');
            checkboxFriend = parent.querySelectorAll('.hidden-friend-checkbox');
            for (var y = 0; y < checkboxFriend.length; y++) {
                checkboxFriend[y].checked = false;
            }
            checkActivateFriend.checked = false;
        }
    } else if (target.closest('.friends')) {
        parent = target.closest('.friends');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var f = 0; f < checkbox.length - 1; f++) {
            checkbox[f].checked = false;
        }
        target.checked = true;
        parent.setAttribute('data-permission', target.value);
        if (target.value === 'Видно всем') {
            listFriendsChecked = parent.querySelector('.list-check-user');
            btnUpdate = parent.querySelector('.btn-settings.update');
            listFriendsChecked.innerHTML = '';
            btnUpdate.style.display = 'none';
            checkActivateFriend = parent.querySelector('.checkbox-permission.friend');
            checkboxFriend = parent.querySelectorAll('.hidden-friend-checkbox');
            for (var u = 0; u < checkboxFriend.length; u++) {
                checkboxFriend[u].checked = false;
            }
            checkActivateFriend.checked = false;
        }
    } else if (target.closest('.post')) {
        parent = target.closest('.post');
        checkbox = parent.querySelectorAll('.checkbox-permission');
        for (var p = 0; p < checkbox.length - 1; p++) {
            checkbox[p].checked = false;
        }
        target.checked = true;
        parent.setAttribute('data-permission', target.value);
        if (target.value === 'Видно всем') {
            listFriendsChecked = parent.querySelector('.list-check-user');
            btnUpdate = parent.querySelector('.btn-settings.update');
            listFriendsChecked.innerHTML = '';
            btnUpdate.style.display = 'none';
            checkActivateFriend = parent.querySelector('.checkbox-permission.friend');
            checkboxFriend = parent.querySelectorAll('.hidden-friend-checkbox');
            for (var s = 0; s < checkboxFriend.length; s++) {
                checkboxFriend[s].checked = false;
            }
            checkActivateFriend.checked = false;
        }
    }
    saveSettings(); // после установки какой либо настройки, сохраняем ее через вызов функции
}

// функция показа блока с друзьями, от которых можно скрыть контент
function visibleFriend(event) {
    var target = event.target;
    var parent;
    var listFriends;
    var btnCreate;
    var btnUpdate;

    // проверям в какой области нужно выводить блок
    if (target.closest('.photo')) {
        parent = target.closest('.photo');
        listFriends = parent.querySelector('.list-friends');
        btnCreate = parent.querySelector('.btn-settings.create');
        btnUpdate = parent.querySelector('.btn-settings.update');
        // если ранее уже были выбраны какие-то друзья, сохраняем их списке
        // в зависимости от того, были раньше друзья или нет, показываем нужную кнопку открытия блока
        if (target.checked) {
            listFriends.style.display = 'block';
            btnCreate.style.display = 'block';
            btnUpdate.style.display = 'none';
        } else {
            listFriends.style.display = 'none';
            btnCreate.style.display = 'none';
        }
    } else if (target.closest('.audios')) {
        parent = target.closest('.audios');
        listFriends = parent.querySelector('.list-friends');
        btnCreate = parent.querySelector('.btn-settings.create');
        btnUpdate = parent.querySelector('.btn-settings.update');
        if (target.checked) {
            listFriends.style.display = 'block';
            btnCreate.style.display = 'block';
            btnUpdate.style.display = 'none';
        } else {
            listFriends.style.display = 'none';
            btnCreate.style.display = 'none';
        }
    } else if (target.closest('.video')) {
        parent = target.closest('.video');
        listFriends = parent.querySelector('.list-friends');
        btnCreate = parent.querySelector('.btn-settings.create');
        btnUpdate = parent.querySelector('.btn-settings.update');
        if (target.checked) {
            listFriends.style.display = 'block';
            btnCreate.style.display = 'block';
            btnUpdate.style.display = 'none';
        } else {
            listFriends.style.display = 'none';
            btnCreate.style.display = 'none';
        }
    } else if (target.closest('.group')) {
        parent = target.closest('.group');
        listFriends = parent.querySelector('.list-friends');
        btnCreate = parent.querySelector('.btn-settings.create');
        btnUpdate = parent.querySelector('.btn-settings.update');
        if (target.checked) {
            listFriends.style.display = 'block';
            btnCreate.style.display = 'block';
            btnUpdate.style.display = 'none';
        } else {
            listFriends.style.display = 'none';
            btnCreate.style.display = 'none';
        }
    } else if (target.closest('.friends')) {
        parent = target.closest('.friends');
        listFriends = parent.querySelector('.list-friends');
        btnCreate = parent.querySelector('.btn-settings.create');
        btnUpdate = parent.querySelector('.btn-settings.update');
        if (target.checked) {
            listFriends.style.display = 'block';
            btnCreate.style.display = 'block';
            btnUpdate.style.display = 'none';
        } else {
            listFriends.style.display = 'none';
            btnCreate.style.display = 'none';
        }
    } else if (target.closest('.post')) {
        parent = target.closest('.post');
        listFriends = parent.querySelector('.list-friends');
        btnCreate = parent.querySelector('.btn-settings.create');
        btnUpdate = parent.querySelector('.btn-settings.update');
        if (target.checked) {
            listFriends.style.display = 'block';
            btnCreate.style.display = 'block';
            btnUpdate.style.display = 'none';
        } else {
            listFriends.style.display = 'none';
            btnCreate.style.display = 'none';
        }
    }
}

// функция обработки выбранных друзей
function checkboxFriends(event) {
    var target = event.target;
    var parent = target.closest('.hidden-friend-block');
    var listFriendsChecked = parent.querySelector('.list-check-user');
    var listFriends = parent.querySelector('.list-friends');
    var checkbox = parent.querySelectorAll('.hidden-friend-checkbox');
    var checkUser = parent.querySelector('.check-user');
    var btnCreate = parent.querySelector('.btn-settings.create');
    var btnUpdate = parent.querySelector('.btn-settings.update');
    var checkActivateFriend = parent.parentElement.querySelector('.checkbox-permission.friend');

    listFriendsChecked.innerHTML = ''; // очищаем прошлый список
    var arr = [];
    for (var i = 0; i < checkbox.length; i++) {
        if (checkbox[i].checked) { // считаем выбранных
            arr.push(checkbox[i].value); // и записываем их в массив
            // обрабатываем выбранных друзей для дальнейшего показа их в шаблоне
            var clone = checkUser.cloneNode(true);
            clone.removeAttribute('style');
            var a = clone.querySelector('a');
            clone.setAttribute('data-id', checkbox[i].value);
            a.innerHTML = checkbox[i].getAttribute('data-name');
            listFriendsChecked.appendChild(clone);
        }
    }
    // проверяем был выбор или нет
    if (arr.length !== 0) {
        btnUpdate.style.display = 'block';
        btnCreate.style.display = 'none';
        listFriends.style.display = 'none';
    } else {
        btnCreate.style.display = 'none';
        listFriends.style.display = 'none';
        checkActivateFriend.checked = false;
    }
    var mainParent;

    // записываем данные по выбранным юзерам в шаблон для дальнейшей обработки
    if (target.closest('.photo')) {
        mainParent = target.closest('.photo');
        mainParent.setAttribute('data-permission', checkActivateFriend.value);
        mainParent.setAttribute('data-friends', arr);
    } else if (target.closest('.audios')) {
        mainParent = target.closest('.audios');
        mainParent.setAttribute('data-permission', checkActivateFriend.value);
        mainParent.setAttribute('data-friends', arr);
    } else if (target.closest('.video')) {
        mainParent = target.closest('.video');
        mainParent.setAttribute('data-permission', checkActivateFriend.value);
        mainParent.setAttribute('data-friends', arr);
    } else if (target.closest('.group')) {
        mainParent = target.closest('.group');
        mainParent.setAttribute('data-permission', checkActivateFriend.value);
        mainParent.setAttribute('data-friends', arr);
    } else if (target.closest('.friends')) {
        mainParent = target.closest('.friends');
        mainParent.setAttribute('data-permission', checkActivateFriend.value);
        mainParent.setAttribute('data-friends', arr);
    } else if (target.closest('.post')) {
        mainParent = target.closest('.post');
        mainParent.setAttribute('data-permission', checkActivateFriend.value);
        mainParent.setAttribute('data-friends', arr);
    }
    saveSettings(); // активируем функцию сохранения, после выбранных действий
}

// функция изменения списка ранее выбранных друзей
function checkboxFriendsUpdate(event) {
    var target = event.target;
    var parent = target.closest('.hidden-friend-block');
    var listFriendsChecked = parent.querySelector('.list-check-user');
    var listFriends = parent.querySelector('.list-friends');
    var checkbox = parent.querySelectorAll('.hidden-friend-checkbox');
    var checkUserActive = listFriendsChecked.querySelectorAll('.check-user');
    var btnCreate = parent.querySelector('.btn-settings.create');
    var btnUpdate = parent.querySelector('.btn-settings.update');

    for (var e = 0; e < checkbox.length; e++) {
        for (var i = 0; i < checkUserActive.length; i++) {
                if (checkbox[e].value === checkUserActive[i].getAttribute('data-id')) {
                    checkbox[e].checked = true;
            }
        }
    }

    btnUpdate.style.display = 'none';
    listFriends.style.display = 'block';
    btnCreate.style.display = 'block';
}

// функция удаления друга из ранее выбранного списка
function cancelFriend(event) {
    var target = event.target;
    var parent = target.closest('.hidden-friend-block');
    var listFriendsChecked = parent.querySelector('.list-check-user');
    var checkbox = parent.querySelectorAll('.hidden-friend-checkbox');
    var checkUser = target.closest('.check-user');
    var btnUpdate = parent.querySelector('.btn-settings.update');
    var checkActivateFriend = parent.parentElement.querySelector('.checkbox-permission.friend');

    var mainParent;

    // проверяем область удаления
    if (target.closest('.photo')) {
        mainParent = target.closest('.photo');
        mainParent.setAttribute('data-friends', checkUser.getAttribute('data-id'));
    } else if (target.closest('.audios')) {
        mainParent = target.closest('.audios');
        mainParent.setAttribute('data-friends', checkUser.getAttribute('data-id'));
    } else if (target.closest('.video')) {
        mainParent = target.closest('.video');
        mainParent.setAttribute('data-friends', checkUser.getAttribute('data-id'));
    } else if (target.closest('.group')) {
        mainParent = target.closest('.group');
        mainParent.setAttribute('data-friends', checkUser.getAttribute('data-id'));
    } else if (target.closest('.friends')) {
        mainParent = target.closest('.friends');
        mainParent.setAttribute('data-friends', checkUser.getAttribute('data-id'));
    } else if (target.closest('.post')) {
        mainParent = target.closest('.post');
        mainParent.setAttribute('data-friends', checkUser.getAttribute('data-id'));
    }

    // после удаления из шаблона, так же снимаем отметку в списке друзей
    listFriendsChecked.removeChild(checkUser);
    var checkUserActive = listFriendsChecked.querySelectorAll('.check-user');
    if (checkUserActive.length === 0) {
        checkActivateFriend.checked = false;
        btnUpdate.style.display = 'none';
        for (var i = 0; i < checkbox.length; i++) {
            checkbox[i].checked = false;
        }
    }
    saveSettings();
}

// функция сохранения настроек
function saveSettings() {
    // собираем все изменения из родительских блоков
    var TypeProfile = document.querySelector('.all');
    var Photo = document.querySelector('.photo');
    var Audio = document.querySelector('.audios');
    var Video = document.querySelector('.video');
    var Group = document.querySelector('.group');
    var Friends = document.querySelector('.friends');
    var Post = document.querySelector('.post');
    var slug = document.location.href.match(/.+\/\/.+\/\w+\/(\d+)\/\w+\//);

    $.ajax({
        url: '/permission/',
        type: 'POST',
        data: {
            slug: slug[1], // слаг пользователя
            txtTypeProfile: TypeProfile.getAttribute('data-permission'),
            txtAudio: Audio.getAttribute('data-permission'),
            audioFriendHid: Audio.getAttribute('data-friends'),
            txtVideo: Video.getAttribute('data-permission'),
            videoFriendHid: Video.getAttribute('data-friends'),
            txtPhoto: Photo.getAttribute('data-permission'),
            photoFriendHid: Photo.getAttribute('data-friends'),
            txtPost: Post.getAttribute('data-permission'),
            postFriendHid: Post.getAttribute('data-friends'),
            txtGroup: Group.getAttribute('data-permission'),
            groupFriendHid: Group.getAttribute('data-friends'),
            txtFriends: Friends.getAttribute('data-permission'),
            friendsFriendHid: Friends.getAttribute('data-friends'),
        },
        success: function () {
            // после сохранения очищаем данные в шаблоне
            TypeProfile.removeAttribute('data-permission');
            Audio.removeAttribute('data-permission');
            Audio.removeAttribute('data-friends');
            Video.removeAttribute('data-permission');
            Video.removeAttribute('data-friends');
            Photo.removeAttribute('data-permission');
            Photo.removeAttribute('data-friends');
            Group.removeAttribute('data-permission');
            Group.removeAttribute('data-friends');
            Post.removeAttribute('data-permission');
            Post.removeAttribute('data-friends');
            Friends.removeAttribute('data-permission');
            Friends.removeAttribute('data-friends');
        }
    });
}