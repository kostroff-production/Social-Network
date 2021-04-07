var play = document.querySelector('#play');
var next = document.querySelector('#next');
var title = document.querySelector('#title');
var recent_volume= document.querySelector('#volume');
var volume_show = document.querySelector('#volume_show');
var slider = document.querySelector('#duration_slider');
var track_image = document.querySelector('#track_image');
var auto_play = document.querySelector('#auto');
var present = document.querySelector('#present');
var total = document.querySelector('#total');
var artist = document.querySelector('#artist');
var blockAudio = document.querySelector('#blockAudio');
var allBlockAudio = document.querySelector('#blockAllAudio');
var backgroundDivRePost = document.getElementById('backgroundDivRePost');
var AudioForm = document.getElementById('AudioForm');



var timer;
var autoplay = 0;

var index_no = 0;
var Playing_song = false;

//после загрузки документа добавляем аудио жлемент в шаблон
var track = document.createElement('audio');


//создаем переменную All songs, которая будет содержать все аудио записи страницы, которую выбрал пользователь
var All_song;

window.addEventListener('load', loadAudio); // после загрузки окна активируем функцию загрузки аудио

// забираем ключи номера страниц
var tab1 = document.getElementById('tab2-1');
tab1.addEventListener('click', identificationChecked);
var tab2 = document.getElementById('tab2-3');
tab2.addEventListener('click', identificationChecked);
var checked = 1; // по умолчаю передает ключ 1 страницы, страницы с записями пользователя

function identificationChecked() {
    var num = this.getAttribute('id').replace(/\w+-/, ''); // через регулярку забираем только номер страницы
    checked = parseInt(num); // конвертируем его в числовой тип данных
    loadAudio();
}

// метод поиска аудио записей на странице
function searchAudio() {
    var search_input = document.getElementById('SearchInput');
    var user = search_input.getAttribute('data-user');
    if (search_input.value !== '') {
        $.ajax({
            url: '/search/Audios/',
            type: 'GET',
            data: {
                num_tab: checked, // в заивисмости от номера страницы задается область поиска
				user: user, // указываем в чьих записях ищем
                q: search_input.value // и что ищем
            },
            success: function (data) { // на выходе забираем json
                All_song = data; // переписываем существующий список песен
                var listAudio; // забираем блок хрянящий искомые песни
                var boxAudio; // забираем шаблон аудио записи
                if (checked === 1) {
                    listAudio = blockAudio.querySelector('.list-audio');
                    boxAudio = blockAudio.querySelector('.audio-track');
                } else if (checked === 3) {
                    listAudio = allBlockAudio.querySelector('.list-audio');
                    boxAudio = allBlockAudio.querySelector('.audio-track');
                }

                listAudio.innerHTML = ''; // очищаем блок от старых записей
                for (var key in  All_song) { // записываем новые аудио на страницу используя данные с json файла
                    All_song[key].singer = parseInt(key) + 1;
                    var clone = boxAudio.cloneNode(true); // клонируем шаблон аудио и заполняем
                    clone.setAttribute('data-id', All_song[key].id);
                    clone.removeAttribute('style');
                    var name = clone.querySelector('p');
                    name.innerHTML = All_song[key].author_track + ' - ' + All_song[key].title_track;
                    var block_name = clone.querySelector('.audio-name');
                    block_name.setAttribute('data-index_no', parseInt(key));
                    var boxRePostAudio = clone.querySelector('.audio-player-box');
                    boxRePostAudio.setAttribute('id', 'audio-' + All_song[key].singer);
                    var track_name = clone.querySelector('.track-name');
                    track_name.innerHTML = All_song[key].author_track + ' - ' + All_song[key].title_track;
                    var audio = clone.querySelector('.audio');
                    audio.src = All_song[key].audio;
                    listAudio.appendChild(clone); // добавляем на страницу каждый найденный аудио файл
                }
		if (All_song) {
		    load_track(index_no); // передаем номер трека для начала воспроизведения
		}
             }
        });
    }
}

// функция распределения аудио файлов по странице и подготовки их к воспроизведения
function loadAudio () {
	// т.к. аудио файлы из БД мы вытягиваем в зависмости от того на странице какого пользователя
	// мы находимся, то мы должны передать слаг этого пользователя, для подгрузки файлов
	var url = document.location.href.match(/.+\/\/.+\/.+\/(\w+)\/.+\//); // слаг забираем прям из адресной строки, обработав его регуляркой

	$.ajax({
		url: '/serializers/Audio/',
		type: 'GET',
		data: {
		    checked: checked,
			slug: url[1]
		},
		success: function (data) {
			// процесс показа файлов на странице такой же как и после поиска
			All_song = data;
			var listAudio;
			var boxAudio;
			if (checked === 1) {
			    listAudio = blockAudio.querySelector('.list-audio');
			    boxAudio = blockAudio.querySelector('.audio-track');
            } else if (checked === 3) {
			    listAudio = allBlockAudio.querySelector('.list-audio');
			    boxAudio = allBlockAudio.querySelector('.audio-track');
            }

			listAudio.innerHTML = '';
			for (var key in  All_song) {
				All_song[key].singer = parseInt(key) + 1;
				var clone = boxAudio.cloneNode(true);
				clone.setAttribute('data-id', All_song[key].id);
				clone.removeAttribute('style');
				var name = clone.querySelector('p');
				name.innerHTML = All_song[key].author_track + ' - ' + All_song[key].title_track;
				var block_name = clone.querySelector('.audio-name');
				block_name.setAttribute('data-index_no', parseInt(key));
				var boxRePostAudio = clone.querySelector('.audio-player-box');
				boxRePostAudio.setAttribute('id', 'audio-' + All_song[key].singer);
				var track_name = clone.querySelector('.track-name');
				track_name.innerHTML = All_song[key].author_track + ' - ' + All_song[key].title_track;
				var audio = clone.querySelector('.audio');
				audio.src = All_song[key].audio;
				listAudio.appendChild(clone);
			}
			if (All_song) {
			    load_track(index_no); 
			}
		}
	});
}

// функция загрузки треков после прогрузки плейлиста
function load_track(index_no){
	clearInterval(timer); // сбрасываем временной интервал прошлой песни
	reset_slider(); // сбрасываем бегунок продолжительности песни

	track.src = All_song[index_no].audio; // прописываем место хранения трека
	title.innerHTML = All_song[index_no].author_track + ' - ' + All_song[index_no].title_track; // название и автора
    track.load(); // начинаем загрузку трека

	timer = setInterval(range_slider ,1000); // движение бегунка раз в секунду
	total.innerHTML = All_song.length; // указываем колличество треков на странице
	present.innerHTML = All_song[index_no].singer; // указываем номер текущей песни

	$.ajax({ // подгружаем альбом воспроизводимой песни
		url: '/serializers/AlbumAudioTrack/',
		type: 'GET',
		data: {
			author_track: All_song[index_no].author_track
		},
		success: function (album) {
			if (album[0]) { // если альбом есть то устанавливаем его
			    track_image.src = album[0].photo;
			    GetColor();
            } else { // если нет то оставляем лефолтный
			    track_image.src ='/media/user_16131596871613159687/photo/AlbumDefault.jpg';
			    GetColor(); // активирует функцию определения цвета фона исходя из альбома
            }
		}
	});
}



//функция отключения звука
function mute_sound(){
	track.volume = 0;
	volume.value = 0;
	volume_show.innerHTML = 0;
}

// функция изменения фона исходя из цветовой палитры альбома
function GetColor() {
	$.ajax({
		url: '/color/',
		type: 'POST',
		data: {
			src: track_image.getAttribute('src') // передаем место хранения обложки альбома в  проекте
		},
		success: function (json) {
			track_image.setAttribute('style', 'box-shadow: 0 0 10px 5px ' + json.colors['colors'][0] + ';');

			var box_background = document.querySelector('.box-background-audio');
			var one = box_background.querySelector('.box-one');
			var two = box_background.querySelector('.box-two');
			box_background.classList.toggle('full');
			// исходя из того на какой странице пользователь, подлючаем задний фон на заготовленные блоки
			if (box_background.className === 'box-background-audio full') {
				two.style.background = 'linear-gradient(to left,' + json.colors['colors'][0] + ', ' + json.colors['colors'][1] + ')';
			} else {
				one.style.background = 'linear-gradient(to left,' + json.colors['colors'][0] + ', ' + json.colors['colors'][1] + ')';
			}
		}
	});
}

// функция воспроизведения или паузы
 function justplay(){
 	if(Playing_song === false){ // в зависимости от текущего режима
 		playsong();
 	}else{
 		pausesong();
 	}
 }


// сброс бегунка длинны трека
 function reset_slider(){
 	slider.value = 0;
 }

// функция воспроизведения трека
function playsong(){
  track.play();
  Playing_song = true;
  play.innerHTML = '<i class="fa fa-pause" aria-hidden="true"></i>'; // устанавливаем знаек паузы в шаблоне
}

// функция паузы трека
function pausesong(){
	track.pause();
	Playing_song = false;
	play.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>'; // устанавливаем значек паузы
}

// функция активации трека из списка выбранного по клику
function clickTrack(event) {
	var parent = event.target.closest('.audio-name');
	var num_track = parent.getAttribute('data-index_no');
	index_no = num_track;
	load_track(index_no);
	playsong();
}

// переключение на следующий аудио трек
function next_song(){
	if(index_no < All_song.length - 1){ // если есть куда переключить то следующий трек
		index_no += 1;
		load_track(index_no);
		playsong();
	}else{ // если нет то на первый
		index_no = 0;
		load_track(index_no);
		playsong();
	}
}


// вернуться на предыдущий трек
function previous_song(){
	if(index_no > 0){
		index_no -= 1;
		load_track(index_no);
		playsong();
	}else{
		index_no = All_song.length;
		load_track(index_no);
		playsong();
	}
}


// изменение громкоскти музыки бегунком
function volume_change(){
	volume_show.innerHTML = recent_volume.value;
	track.volume = recent_volume.value / 100;
}

// изменение позиции бегунка трека
function change_duration(){
	slider_position = track.duration * (slider.value / 100);
	track.currentTime = slider_position;
}

// активация автовоспроизведения следующего трека после окончания текущего
function autoplay_switch(){
	if (autoplay === 1){
		autoplay = 0;
		auto_play.style.background = "rgba(255,255,255,0.3)";
	}else{
		autoplay = 1;
		auto_play.style.background = "#fd264f"; // меняем фон кнопки после активации
	}
}


function range_slider(){
	var position = 0;
        
        // обновление позиции бегунка
		if(!isNaN(track.duration)){
		   position = track.currentTime * (100 / track.duration);
		   slider.value =  position;
	      }

       
       // после завершения воспроизведения
       if(track.ended){
       	 play.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
           if(autoplay === 1){
		       index_no += 1;
		       load_track(index_no);
		       playsong();
           }
	    }
     }

// удаление своих аудио записей из плейлиста
function DeleteAudio(event) {
    var audio = event.target.closest('.audio-track');
    var obj_id = audio.getAttribute('data-id');
    $.ajax({
       url: '/Audio/Delete/',
       type: 'POST',
       data: {
           id_obj: obj_id // для удаление нужей айди модли
       },
       success: function () {
           audio.style.display = 'none'; // после удаления скрываем блок с записью на странице
       }
    });
}

// фукция показа окна загрузки трека
function showAudioForm() {
	var body = document.body;
	if (AudioForm.style.display === 'none') {
        backgroundDivRePost.style.display = 'block';
        AudioForm.style.display = 'block';
        AudioForm.style.left = (body.offsetWidth - AudioForm.offsetWidth) / 2 + 'px';
        AudioForm.style.top = AudioForm.offsetHeight + 'px';
    }
}

// функция автозаполнения автора и названия трека
function saveAudioFile() {
    var id_audio = document.getElementById('id_audio');
    var id_author_track = document.getElementById('id_author_track');
    var id_title_track = document.getElementById('id_title_track');
    var str = String(id_audio.value);
    var str1 = str.replace(/.+\\.+\\/, ''); // так как пользователь сам не заполняет данные о песне
    var str2 = str1.match(/(.*)\-(.*)\.\w+/); // мы определяем исходя из названия файла автора и название трека
    var str3 = str1.match(/(.*)\.\w+/); // и записываем их
    var author_audio = '';
    var title_audio = '';
    if (str2 === null) {
        title_audio = str3[1];
    }else {
        author_audio = str2[1];
        title_audio = str2[2];
    }
    id_author_track.value = author_audio.trim(); // в скрытую форму автора
    id_title_track.value = title_audio.trim(); // и названия трека
}

// функция хакрытия формы добавления
function cancelForm() { // очищаем все заполненные данные формы
    backgroundDivRePost.style.display = 'none';
	AudioForm.style.display = 'none';
	AudioForm.style.top = 0;
	AudioForm.style.left = 0;
}

