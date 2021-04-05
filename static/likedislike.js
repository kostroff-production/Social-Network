function like(event) // функция присвоения голоса
{
    var target = event.target; // т.к. некоторые объекты создаются динамически, то event необходим для реализации функции
    var like = target.closest('.btn-bi');
    var type = like.getAttribute('data-type');
    var action = like.getAttribute('data-action');
    var id = like.getAttribute('data-id');

    $.ajax({
        url : "/" + type + "/" + action + "/",
        type : 'POST',
        data : { 'obj_id' : id },

        success : function (json) {
            like.querySelector(".bi-count").innerText = json.like_count; // меняет количество голосов
            if (json.result) { // в зависимости от голоса, меняем данные в шаблоне
                like.querySelector("[class='bi bi-heart-fill']").style.display = 'inline-block';
                like.querySelector("[class='bi bi-heart']").style.display = 'none';
            } else {
                like.querySelector("[class='bi bi-heart-fill']").style.display = 'none';
                like.querySelector("[class='bi bi-heart']").style.display = 'inline-block';
            }
        }
    });
    return false;
}

function dislike()
{
    var dislike = $(this);
    var obj = dislike.data('obj');
    var type = dislike.data('type');
    var slug = dislike.data('slug');
    var action = dislike.data('action');
    var like = dislike.prev();

    $.ajax({
        url : "/" + obj+ "/" + slug + "/" + type + "/" + action + "/",
        type : 'POST',
        data : { 'obj' : slug },

        success : function (json) {
            dislike.find("[data-count='dislike']").text(json.dislike_count);
            like.find("[data-count='like']").text(json.like_count);
        }
    });

    return false;
}

// Подключение обработчиков
$(function () {
    $('[data-action="Like"]').click(like);
    $('[data-action="dislike"]').click(dislike);
});





