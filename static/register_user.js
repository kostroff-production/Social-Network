var first_name = document.getElementById('id_first_name');
var last_name = document.getElementById('id_last_name');
var middle_name = document.getElementById('id_middle_name');
var phone = document.getElementById('id_phone');
var day = document.getElementById('id_date_birth_day');
var month = document.getElementById('id_date_birth_month');
var year = document.getElementById('id_date_birth_year');
var gender = document.getElementById('id_gender');
first_name.style.display = 'none';
last_name.style.display = 'none';
middle_name.style.display = 'none';
day.style.display = 'none';
month.style.display = 'none';
year.style.display = 'none';
gender.style.display = 'none';

var email = document.getElementById('id_email');
var password = document.getElementById('id_password');

$('#hint_base').fadeIn(1000); // анимация подсказки

var dayList = day.querySelectorAll('option');
var monthList = month.querySelectorAll('option');
var yearList = year.querySelectorAll('option');

// функция обработки дней
day.addEventListener('click', function () {
    if (day.value === '30' && year.value % 4 === 0) { // проверяем месяца на датировку при високосном годе
        monthList[1].disabled = 'true';
        monthList[3].removeAttribute('disabled');
        monthList[5].removeAttribute('disabled');
        monthList[8].removeAttribute('disabled');
        monthList[10].removeAttribute('disabled');
        for (var q = 0; q < monthList.length; q++) {
            if (monthList[q].hasAttribute('disabled')) {
                monthList[q].style.color = '#FF7369';
            } else {
                monthList[q].removeAttribute('style');
            }
        }
    // проверяем месяца на максимальное количество дней
    } else if (day.value > '28' && day.value <= '30' && year.value % 4 !== 0) {
        monthList[1].disabled = 'true';
        monthList[3].removeAttribute('disabled');
        monthList[5].removeAttribute('disabled');
        monthList[8].removeAttribute('disabled');
        monthList[10].removeAttribute('disabled');
        for (var a = 0; a < monthList.length; a++) {
            if (monthList[a].hasAttribute('disabled')) {
                monthList[a].style.color = '#FF7369';
            } else {
                monthList[a].removeAttribute('style');
            }
        }
    } else if (day.value > '30') {
        monthList[1].disabled = 'true';
        monthList[3].disabled = 'true';
        monthList[5].disabled = 'true';
        monthList[8].disabled = 'true';
        monthList[10].disabled = 'true';
        for (var e = 0; e < monthList.length; e++) {
            if (monthList[e].hasAttribute('disabled')) {
                monthList[e].style.color = '#FF7369';
            }
        }
    } else if (day.value === '29' && year.value % 4 === 0) {
        for (var s = 0; s < monthList.length; s++) {
            if (monthList[s].hasAttribute('disabled')) {
                monthList[s].removeAttribute('disabled');
                monthList[s].removeAttribute('style');
            }
        }
    } else {
        for (var i = 0; i < monthList.length; i++) {
            if (monthList[i].hasAttribute('disabled')) {
                monthList[i].removeAttribute('disabled');
                monthList[i].removeAttribute('style');
            }
        }
    }
});

// функция обработки месяцев
month.addEventListener('click', function () {
    if (month.value === '2') { // проверяем, что месяц февраль
        // проверка на високосный год
        if (year.value % 4 === 0) {
            dayList[28].removeAttribute('disabled');
            dayList[29].disabled = 'true';
            dayList[30].disabled = 'true';
            for (var i = 0; i < dayList.length; i++) {
                if (dayList[i].hasAttribute('disabled')) {
                    dayList[i].style.color = '#FF7369';
                } else {
                    dayList[i].removeAttribute('style');
                }
            }
        } else {
            dayList[28].disabled = 'true';
            dayList[29].disabled = 'true';
            dayList[30].disabled = 'true';
            for (var e = 0; e < dayList.length; e++) {
                if (dayList[e].hasAttribute('disabled')) {
                    dayList[e].style.color = '#FF7369';
                } else {
                    dayList[e].removeAttribute('style');
                }
            }
        }
    // ограничиваем колличесво дней в месяцах соответствующих этому
    } else if (month.value === '4' || month.value === '6' || month.value === '9' || month.value === '11') {
        dayList[28].removeAttribute('disabled');
        dayList[29].removeAttribute('disabled');
        dayList[30].disabled = 'true';
        for (var s = 0; s < dayList.length; s++) {
                if (dayList[s].hasAttribute('disabled')) {
                    dayList[s].style.color = '#FF7369';
                } else {
                    dayList[s].removeAttribute('style');
                }
            }
    } else {
        dayList[28].removeAttribute('disabled');
        dayList[29].removeAttribute('disabled');
        dayList[30].removeAttribute('disabled');
        for (var q = 0; q < dayList.length; q++) {
                if (dayList[q].hasAttribute('disabled')) {
                    dayList[q].style.color = '#FF7369';
                } else {
                    dayList[q].removeAttribute('style');
                }
            }
    }
});

// функция обработки года
year.addEventListener('click', function () {
    // проверяем на февраль
   if (day.value === '29' && month.value === '2') {
       for (var i = 0; i < yearList.length; i++) {
           if(yearList[i].value % 4 !== 0) { // проверяем на високосность
               yearList[i].disabled = 'true';
               yearList[i].style.color = '#FF7369';
           }
       }
   } else {
       for (var e = 0; e < yearList.length; e++) {
           if (yearList[e].hasAttribute('disabled')) {
               yearList[e].removeAttribute('disabled');
               yearList[e].removeAttribute('style');
           }
       }
   }
});

// функции позиционирования и анимировая строк шаблонов

function next() { // функция навешивается в шаблоне на кнопку
    var start = Date.now();
    var timer = setInterval(function () { // устанавливаем плавность перехода от раздела к разделу
       var timePassed = Date.now() - start;

       // позиционируем строки
       email.style.marginLeft = -timePassed / 2 + 'px';
       phone.style.marginLeft = timePassed / 2 + 'px';
       password.style.marginLeft = -timePassed / 2 + 'px';

       if (timePassed > 2000) {
           clearInterval(timer);
       }
    }, 20);
}

function twoNext() {
    var start = Date.now();
    var timer = setInterval(function () {
       var timePassed = Date.now() - start;

       first_name.style.marginLeft = -timePassed / 2 + 'px';
       last_name.style.marginLeft = timePassed / 2 + 'px';
       middle_name.style.marginLeft = -timePassed / 2 + 'px';

       if (timePassed >= 2000) {
           clearInterval(timer);
       }
    }, 20);
}

var next_btn = $('#next_btn');
var two_next_btn = $('#two_next_btn');
var register_btn = $('#register_btn');

next_btn.click(function () { // анимация для формы ввода данных
   $('#id_phone').fadeOut(1000);
   $('#id_email').fadeOut(1000);
   $('#id_password').fadeOut(1000);
   next_btn.fadeOut(1000);
   setTimeout(function () {
        $('#id_first_name').fadeIn(1000);
        $('#id_last_name').fadeIn(1000);
        $('#id_middle_name').fadeIn(1000);
        two_next_btn.fadeIn(1000);
        nextShow();
   }, 1500);
});

function nextShow() {
    var start = Date.now() + 1000;
    var timer = setInterval(function () {
        var timePassed = Date.now() - start;

       first_name.style.marginLeft = timePassed / 2 + 'px';
       last_name.style.marginLeft = -timePassed / 2 + 'px';
       middle_name.style.marginLeft = timePassed / 2 + 'px';

       if (timePassed >= 0) {
           clearInterval(timer);
       }
    }, 40);
}

two_next_btn.click(function () {
    $('#id_first_name').fadeOut(1000);
    $('#id_last_name').fadeOut(1000);
    $('#id_middle_name').fadeOut(1000);
    two_next_btn.fadeOut(1000);
    setTimeout(function () {
        $('#id_date_birth_day').fadeIn(1000);
        $('#id_date_birth_month').fadeIn(1000);
        $('#id_date_birth_year').fadeIn(1000);
        $('#id_gender').fadeIn(1000);
        $('#hint').fadeIn(4000);
        register_btn.fadeIn(4000);
        finalShow();
    },1500);
});

function finalShow() {
    var start = Date.now() + 1000;
    var timer = setInterval(function () {
       var timePassed = Date.now() - start;

       day.style.marginLeft = -timePassed / 2 + 'px';
       month.style.marginLeft = timePassed / 2 + 'px';
       year.style.marginLeft = -timePassed / 2 + 'px';
       gender.style.marginLeft = timePassed / 2 + 'px';

       if (timePassed >= 0) {
           clearInterval(timer);
       }
    }, 40);
}
