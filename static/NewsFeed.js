
// функция открытия блока с описанием к медиа файлу
function showDescriptions(event) {
    var parent = event.target.closest('.descriptionVideo');
    var a = parent.querySelector('a');
    var block = parent.querySelector('.descriptions');
    var Hide = a.getAttribute('data-text-hide');
    var Show = a.getAttribute('data-text-show');
    if (a.innerHTML === Hide) {
        a.innerHTML = Show;
        block.style.display = 'block';
    } else if (a.innerHTML === Show) {
        a.innerHTML = Hide;
        block.style.display = 'none';
    }
}

var btnScroll = document.querySelector('.scrollTop-btn');

// навешиваем на кнопку прокрутки, функцию прокрутки окна
btnScroll.addEventListener('click', function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

window.addEventListener('scroll', function () { // устанавливаем границу показа кнопки прокрутки
    if (pageYOffset > 800) {
        btnScroll.style.display = 'block';
    } else {
        btnScroll.style.display = 'none';
    }
});

var newsFeedList = document.querySelector('.news_list');

// функция активации полноэкранного режима показа фотографий
document.querySelectorAll('.content').forEach(function (item) {
    item.addEventListener('click', function () { // активируем при клике по фото
        if (newsFeedList.offsetWidth > 420) { // функция доступна только на большом экране
            item.classList.toggle('full'); // присваиваем суб класс для применения необходимых стилей
            var image = item.querySelector('img');
            var body = document.body;
            // расчитываем положение фото в зависимости от ее размера
            image.style.top = image.offsetHeight / 6 + 'px';
            image.style.left = (body.offsetWidth - image.offsetWidth) / 2 + 'px';
        }
    });
});