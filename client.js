
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
	viewMode = 'player';

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
	socket.emit('join');
}

function dmlogin(){
	var dmpwd = dom.id('dmpwd');
	socket.emit('dm', dmpwd.value);
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

socket.on('dmy', function(){
	dm = true;
	viewMode = 'dm';
	dom.show('dm');
	map.draw();
});
socket.on('dmn', alert.bind(null, 'Failed to log in.'));

socket.on('init', function(mapd){

	dom.chscreen('main', 'map');
	console.log(mapd);
	map = new Map(mapd);

});

socket.on('u', function(d){
	map.patch(d);
});

socket.on('kick', alert.bind(null, 'You were kicked. See ya!'));
