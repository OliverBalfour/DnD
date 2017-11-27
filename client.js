
var socket = io();

//using es5 just in case
//but damn es6 would shorten the hell outta this
var dom = {
	id: function(s){ return document.getElementById(s) },
	class: function(s){ return document.getElementsByClassName(s) },
	hide: function(s){ this.id(s).classList.add('hidden') },
	show: function(s){ this.id(s).classList.remove('hidden') },
	chscreen: function(a, b){ this.hide(a); this.show(b) }
}

var canvas = dom.id('canvas'),
	ctx = canvas.getContext('2d'),
	dm = false,
	viewMode = 'player',
	grid = true;

var map = null;

//Fix up the DM toolbar backgrounds
//And update the color picker things backgrounds and things
(function(){
	var md = dom.class('mode');

	for(var i = 0; i < md.length; i++){
		md[i].style.background = md[i].getAttribute('data-color');
	}

	var pickers = Array.prototype.slice.call(document.getElementsByTagName('input'))
		.filter(function(n){return n.type === 'color'});

	for(var i = 0; i < pickers.length; i++){
		pickers[i].onchange = function(){
			this.parentElement.style.background = this.value;
			if(this.parentElement.classList.contains('active')){
				map.color = this.value;
			}
		}
	}
})();

//Update viewMode in #status
function updateStatus(){
	dom.id('status').innerHTML = (viewMode === 'dm' ? 'DM' : (viewMode === 'edit' ? 'Edit' : 'Player')) + ' view';
}

function join(){
	socket.emit('join', dom.id('username').value);
}

function dmlogin(){
	var dmpwd = dom.id('dmpwd');
	socket.emit('dm', dom.id('username').value, dmpwd.value);
	dmpwd.value = '';
}

function dmmode(el, m){
	if(!dm) return;
	dmbuttons(el);

	map.action = m;
}

function dmcolor(el){
	if(!dm || !el) return;
	if(el.children.length > 0){
		dmcolorpicker(el);
		return;
	}

	dmbuttons(el);

	map.action = 'color';
	map.color = el.getAttribute('data-color');
}

function dmcolorpicker(el){
	if(!dm || !el) return;
	dmbuttons(el);

	map.action = 'color';
	map.color = el.children[0].value;
}

function dmbuttons(el){
	var md = dom.class('mode');

	for(var i = 0; i < md.length; i++){
		md[i].classList.remove('active');
	}

	el.classList.add('active');
}

function exportmap(){
	if(dm)
		socket.emit('dl');
}

function importmap(){
	if(dm)
		dom.show('import-modal');
}

function savemap(){
	if(dm)
		socket.emit('sm', prompt('Name for map'));
}

function loadmap(){
	if(dm)
		socket.emit('lm');
}

function newmap(){
	if(dm)
		socket.emit('nm', parseInt(prompt('Map width')), parseInt(prompt('Map height')));
}

function resizemap(){
	if(dm){
		socket.emit(
			'rm',
			parseInt(prompt('Add how many columns to the left? (negatives don\'t work yet)')),
			parseInt(prompt('Add how many rows to the top?')),
			parseInt(prompt('Add how many columns to the right?')),
			parseInt(prompt('Add how many rows to the bottom?'))
		);
	}
}

socket.on('ml', function(list){
	for(var i = 0, btns = ''; i < list.length; i++){
		btns += "<li onclick='chooseloadmap(\"" + list[i] + "\")'>" + list[i] + "</li>";
	}
	dom.id('loadmm-list').innerHTML = btns;
	dom.show('loadmap-modal');
});

function chooseloadmap(name){
	if(dm){
		socket.emit('clm', name);
		dom.hide('loadmap-modal');
	}
}

dom.id('import-json').onchange = importJSON;

function importJSON(){
	var reader = new FileReader();
	reader.onload = function(event){
		socket.emit('ul', JSON.parse(event.target.result));
		dom.hide('import-modal');
	}
	reader.readAsText(dom.id('import-json').files[0]);
}

socket.on('dmy', function(){
	dm = true;
	viewMode = 'dm';
	dom.show('dm');
	map.draw();
});

socket.on('dmn', alert.bind(null, 'Failed to log in.'));

socket.on('il', function(list){
	for(var i = 0, btns = ''; i < list.length; i++){
		btns += "<li onclick='seticon(\"" + list[i] + "\")'>" + list[i] + "</li>";
	}
	dom.id('iconmm-list').innerHTML = btns;
	dom.show('iconlist-modal');
});

function seticon(name){
	if(dm){
		map.icon = name;
		dom.hide('iconlist-modal');
	}
}

function toggleChat(){
	dom.id('chat').classList.toggle('collapsed');
	dom.id('togglechat').innerHTML = dom.id('chat').classList.contains('collapsed') ? '+' : '-';
}

//On enter, send message
dom.id('chatbar').addEventListener('keydown', function(e){
	if(e.which === 13 && dom.id('chatbar').value !== ''){
		socket.emit('msg', dom.id('chatbar').value);
		dom.id('chatbar').value = '';
	}
});

socket.on('msg', function(msg){
	dom.id('message-history').innerHTML
	 += "<div class='message'><span class='author" + (msg.s ? '-server' : '') + "'><b>" + msg.name + "</b></span>" + msg.msg + "</div>";
});

socket.on('init', function(mapd){

	//If this is the first instance of the map initialise it
	//If a new map has been imported and so there is already a map available then use that
	if(!map) {
		dom.chscreen('main', 'map');
		map = new Map(mapd);
	} else {
		map.w = mapd.w;
		map.h = mapd.h;
		map.data = mapd.data;
		map.draw();	
	}

});

socket.on('ex', function(data){
	var dstr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
	var a = document.createElement('a');
	a.setAttribute('href', dstr);
	a.setAttribute('download', 'map.json');
	a.click();
});

//Can't be map.patch.bind(map) because the map isn't created until the init WS event
socket.on('u', function(d){
	map.patch(d);
});

socket.on('kick', alert.bind(null, 'You were kicked. See ya!'));
