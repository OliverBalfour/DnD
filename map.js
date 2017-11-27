
var W = innerWidth,
	H = innerHeight;

//Right click no context menu
document.body.addEventListener('contextmenu', function(e){
	if(e.preventDefault !== undefined) e.preventDefault();
	if(e.stopPropagation !== undefined) e.stopPropagation();
	
	return false;
});


function Map(d){

	this.w = d.w;
	this.h = d.h;
	this.data = d.data;
	this.x = 0;
	this.y = 0;
	this.ts = 50;
	this.temp = {};

	this.action = 'fow';
	this.color = 'white';
	this.icon = 'all-seeing-eye';
	this.icons = {};

	this.mouse = {
		x: 0,
		y: 0,
		down: false,
		rdown: false
	}

	this.keys = [];

	this.setupCanvasSize();

	//Event listeners

	window.onresize = this.setupCanvasSize.bind(this);

	var that = this;

	//Only count mousedown event when the mouse isn't in the chat
	dom.id('chat').addEventListener('mousedown', function(e){
		that.temp.chatmd = true;
	});
	document.addEventListener('mousedown', function(e){

		if(that.temp.chatmd){
			that.temp.chatmd = false;
			return;
		}

		that.temp.ox = e.clientX - that.x;
		that.temp.oy = e.clientY - that.y;
		that.mouse.x = e.clientX;
		that.mouse.y = e.clientY;

		if(e.button === 0){
			that.mouse.down = true;
		}else if(e.button === 2){
			that.mouse.rdown = true;
			that.temp.rarr = [];
		}

	});
	document.addEventListener('mouseup', function(e){

		//Click
		if(
			e.clientX === that.temp.ox + that.x
			 && e.clientY === that.temp.oy + that.y
		) {
			// e.button = 0 left, 1 middle, 2 right

			if(e.button === 2 && dm) {
				that.doAction(that.tilePoint(e.clientX, e.clientY));
			}
		}

		//Update
		that.temp.ox = that.temp.oy = null;
		that.mouse.x = e.clientX;
		that.mouse.y = e.clientY;

		if(e.button === 0) {
			that.mouse.down = false;
		} else if(e.button === 2) {
			that.mouse.rdown = false;
			that.temp.rarr = null;
			that.temp.rarri = null;
		}

	});
	document.addEventListener('mousemove', function(e){

		//Mousemove is for some reason also triggered by mouseup
		//If this is a click with no mouse movement, disregard this event
		if(
			e.clientX === that.temp.ox + that.x
			 && e.clientY === that.temp.oy + that.y
		) { return; }

		if(that.mouse.down) {

			that.x = (e.clientX - that.temp.ox);
			that.y = (e.clientY - that.temp.oy);
			that.draw();

		} else if(that.mouse.rdown && dm) {

			var t = that.tilePoint(e.clientX, e.clientY);
			if(!that.data[t]) return;
			if(that.temp.rarr.indexOf(t) !== -1)
				return;

			if(that.action === 'fow' && that.temp.rarr.length === 0)
				that.temp.rarri = that.data[t].v;

			if(that.action === 'fow' && that.temp.rarri === that.data[t].v){
				that.doAction(t);
			}else if(that.action === 'spell' || that.action === 'icon'){
				that.doAction(t);
			}else if(that.action !== 'fow'){
				that.doAction(t);
			}

			that.temp.rarr.push(t);

		}

		that.mouse.x = e.clientX;
		that.mouse.y = e.clientY;

	});

	//Only count key events when the chat bar is not focused
	document.addEventListener('keydown', function(e){
		if(dom.id('chatbar') === document.activeElement)
			return;

		that.keys[e.which || e.keyCode] = true;
		that.keydown(e.which || e.keyCode);
	});
	document.addEventListener('keyup', function(e){
		if(dom.id('chatbar') === document.activeElement)
			return;

		that.keys[e.which || e.keyCode] = false;
		that.keyup(e.which || e.keyCode);
	});

}

//Reset the canvas size and redraw
Map.prototype.setupCanvasSize = function(){
	canvas.width = innerWidth;
	canvas.height = innerHeight;
	W = innerWidth;
	H = innerHeight;
	this.draw();
}

Map.prototype.keydown = function(k){

}

Map.prototype.keyup = function(k){
	var tb = dom.id('toolbar');

	//Player and DM hotkeys

	//+ and - to zoom in and out respectively
	//G to toggle grid
	//C to toggle chat
	//Tab to focus/unfocus
	if(k === 71){
		grid = !grid;
		this.draw();
	}else if(k === 189){
		this.zoom(-2);
	}else if(k === 187){
		this.zoom(2);
	}else if(k === 67){
		toggleChat();
	}else if(k === 9){
		if(dom.id('chat').classList.contains('collapsed'))
			toggleChat();
		if(document.activeElement !== dom.id('chatbar'))
			dom.id('chatbar').focus();
		else
			document.body.focus();
	}

	//DM hotkeys, if not DM cancel
	if(!dm) return;

	//H to toggle highlight
	//E (keycode 69 lol) to toggle inverse highlight
	//F or ~ (left of 1) for FoW
	//S for Spell Effect
	//I for Icons
	//2-9 & 0 for colours
	//Left and right or A and D for moving between colours
	if(k === 72){
		viewMode = viewMode === 'player' ? 'dm' : 'player';
		this.draw();
		updateStatus();
	}else if(k === 69){
		viewMode = viewMode === 'edit' ? 'dm' : 'edit';
		this.draw();
		updateStatus();
	}else if(k === 70 || k === 192){
		dmmode(tb.children[0], 'fow');
	}else if(k === 83){
		dmmode(tb.children[1], 'spell');
	}else if(k === 73){
		dmmode(tb.children[2], 'icon');
	}else if(k > 48 && k < 59){
		dmcolor(tb.children[k - 46]);
	}else if(k === 48){
		dmcolor(tb.children[12]);
	}else if(k === 37 || k === 39 || k === 65 || k === 68){
		var i = Array.prototype.slice.call(tb.children).indexOf(dom.class('active')[0]) + ((k === 37 || k === 65) ? -1 : 1);
		if(i === -1) i = tb.children.length - 1;
		if(i === tb.children.length) i = 0;
		tb.children[i].click();
	}
}

//Does this.action
Map.prototype.doAction = function(t){
	if(this.action === 'fow'){
		this.FoW(t);
	}else if(this.action === 'spell'){
		this.spellEffect(t);
	}else if(this.action === 'icon'){
		this.placeIcon(t);
	}else if(this.action === 'color'){
		this.chColor(t);
	}
}

//Get a tile id that collides with a point
Map.prototype.tilePoint = function(x, y){

	var arrX = Math.floor((x - this.x) / this.ts),
		arrY = Math.floor((y - this.y) / this.ts);

	if(arrX >= this.w || arrX < 0 || arrY >= this.h || arrY < 0)
		return false;

	var i = arrY * this.w + arrX;

	return (i < this.w * this.h && i >= 0) ? i : false;

}

//Fog of War toggling, DM only
Map.prototype.FoW = function(i){
	//Can't use !i because i could be 0 which is falsy
	if(i === false) return;
	socket.emit('fow', i);
}

//Spell Effect toggling, DM only
Map.prototype.spellEffect = function(i){
	//Can't use !i because i could be 0 which is falsy
	if(i === false) return;
	socket.emit('sf', i);
}

//Place/toggle icon, DM only
Map.prototype.placeIcon = function(i){
	//Can't use !i because i could be 0 which is falsy
	if(i === false) return;
	socket.emit('ic', i, this.icon);
}

//Change a tile's colour, DM only
Map.prototype.chColor = function(i){
	//Can't use !i because i could be 0 which is falsy
	if(i === false) return;
	socket.emit('cl', i, this.color);
}

//Zoom in/out, positive n for in, negative for out
Map.prototype.zoom = function(n){
	
	var x = (this.mouse.x - this.x) / (this.ts * this.w),
		y = (this.mouse.y - this.y) / (this.ts * this.h);

	this.ts += n;

	if(this.ts < 4) this.ts = 4;
	if(this.ts > 100) this.ts = 100;

	this.x = this.mouse.x - Math.floor(x * this.ts * this.w);
	this.y = this.mouse.y - Math.floor(y * this.ts * this.h);

	this.draw();

}

//Patch up an update transmission
Map.prototype.patch = function(msg){

	var type = msg.charAt(0);

	//I dislike switch statements
	//They're ugly
	// (Not as ugly as the below code though :-) )

	if(type === 'f') {
		this.data[parseInt(msg.substring(1, msg.length - 1))].v
			 = (msg.charAt(msg.length - 1) === '1');
	} else if(type === 's') {
		this.data[parseInt(msg.substring(1, msg.length - 1))].e
			 = (msg.charAt(msg.length - 1) === '1');
	} else if(type === 'i') {

		//If the icon is present then the last character won't be 0
		if(msg.charAt(msg.length - 1) !== '0'){

			//Find the info
			var index = parseInt(msg.substring(1)),
				icon = msg.substring((index+'').length + 1);

			this.data[index].i = icon;

			//If the icon hasn't been loaded, load it
			this.loadIcon(icon);
		}else{
			//Disable the icon for the relevant tile
			this.data[parseInt(msg.substring(1, msg.length - 1))].i = false;	
		}


	} else if(type === 'c') {
		this.data[parseInt(msg.substring(1, msg.indexOf(',')))].c = msg.split(',')[1];
	}

	this.draw();

}

Map.prototype.loadIcon = function(icon){
	if(typeof icon !== 'string') return;
	if(!this.icons[icon]){
		var img = new Image();
		var that = this;
		img.src = './icons/' + icon + '.png';
		img.onload = function(){
			that.icons[icon] = img;
			that.draw();
		}
	}
}

//Draw the map... d'uh
Map.prototype.draw = function(){

	ctx.clearRect(0, 0, W, H);
	ctx.save();
	ctx.translate(this.x, this.y);

	for(var i = 0, tile, x, y; i < this.h * this.w; i++){

		//Data variables
		tile = this.data[i];
		x = i % this.w;
		y = Math.floor(i / this.w);

		this.loadIcon(tile.i);

		//Tile fill colour
		//If FoW is active, draw as black
		//If DM, then draw a thick black border
		if(dm && !tile.v && viewMode === 'dm') {
			ctx.fillStyle = tile.c;
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			if(tile.i && this.icons[tile.i]){
				ctx.drawImage(this.icons[tile.i], x * this.ts, y * this.ts, this.ts, this.ts);
			}
			if(tile.e){
				ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
				ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			}
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'black';
			ctx.strokeRect(-0.5 + x * this.ts + 1, -0.5 + y * this.ts + 1, this.ts - 2, this.ts - 2);
			ctx.strokeStyle = '#333';
		} else if(dm && viewMode === 'edit') {
			ctx.fillStyle = !tile.v ? tile.c : 'black';
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			if(tile.v && tile.i && this.icons[tile.i]){
				ctx.drawImage(this.icons[tile.i], x * this.ts, y * this.ts, this.ts, this.ts);
			}
			if(tile.v && tile.e){
				ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
				ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			}
		} else {
			ctx.fillStyle = tile.v ? tile.c : 'black';
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			if(tile.v && tile.i && this.icons[tile.i]){
				ctx.drawImage(this.icons[tile.i], x * this.ts, y * this.ts, this.ts, this.ts);
			}
			if(tile.v && tile.e){
				ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
				ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			}
		}

		//Border
		if(grid){
			ctx.beginPath();
			ctx.moveTo(-0.5 + (x + 1) * this.ts, y * this.ts);
			ctx.lineTo(-0.5 + (x + 1) * this.ts, -0.5 + (y + 1) * this.ts);
			ctx.lineTo(x * this.ts, -0.5 + (y + 1) * this.ts);
			ctx.stroke();
			ctx.closePath();
		}

	}

	ctx.restore();

}
