var username = document.getElementById('id_username');
var password = document.getElementById('id_password');

username.setAttribute('placeholder', 'Login');
password.setAttribute('placeholder', 'Password');

$('#logon_hint').fadeIn(4000); // анимирование подсказки
