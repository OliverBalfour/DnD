
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
	this.setupCanvasSize();
	this.temp = {};

	this.action = 'fow';
	this.color = 'white';

	this.mouse = {
		x: 0,
		y: 0,
		down: false,
		rdown: false
	}

	this.keys = [];

	//Event listeners

	window.onresize = this.setupCanvasSize.bind(this);

	var that = this;

	document.addEventListener('mousedown', function(e){

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
			} // else { console.log('wtf...') }
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

		if(that.mouse.down) {

			that.x = (e.clientX - that.temp.ox);
			that.y = (e.clientY - that.temp.oy);
			that.draw();

		} else if(that.mouse.rdown && dm) {

			var t = that.tilePoint(e.clientX, e.clientY);
			if(!that.data[t]) return;

			if(that.temp.rarr.indexOf(t) !== -1)
				return;

			if(that.temp.rarr.length === 0)
				that.temp.rarri = !that.data[t].v;

			if(!that.temp.rarri === that.data[t].v)
				that.doAction(t);

			that.temp.rarr.push(t);

		}

		that.mouse.x = e.clientX;
		that.mouse.y = e.clientY;

	});

	document.addEventListener('keydown', function(e){
		that.keys[e.which || e.keyCode] = true;
		that.keydown(e.which || e.keyCode);
	});
	document.addEventListener('keyup', function(e){
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
	if(!dm) return;
	var tb = dom.id('toolbar');
	//H to toggle highlight
	//E (keycode 69 lol) to toggle inverse highlight
	//F for FoW
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
	}else if(k === 70){
		dmmode(tb.children[0], 'fow');
	}else if(k > 48 && k < 59){
		dmcolor(tb.children[k - 48]);
	}else if(k === 48){
		dmcolor(tb.children[10]);
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

//Change a tile's colour, DM only
Map.prototype.chColor = function(i){
	//Can't use !i because i could be 0 which is falsy
	if(i === false) return;
	socket.emit('cl', i, this.color);
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
	} else if(type === 'c') {
		this.data[parseInt(msg.substring(1, msg.indexOf(',')))].c = msg.split(',')[1];
	}

	this.draw();

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
		y = Math.floor(i / this.h);

		//Tile fill colour
		//If FoW is active, draw as black
		//If DM, then draw a thick black border
		if(dm && !tile.v && viewMode === 'dm') {
			ctx.fillStyle = tile.c;
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'black';
			ctx.strokeRect(-0.5 + x * this.ts + 1, -0.5 + y * this.ts + 1, this.ts - 2, this.ts - 2);
			ctx.strokeStyle = '#333';
		} else if(dm && viewMode === 'edit') {
			ctx.fillStyle = !tile.v ? tile.c : 'black';
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
		} else {
			ctx.fillStyle = tile.v ? tile.c : 'black';
			ctx.fillRect(x * this.ts, y * this.ts, this.ts, this.ts);
		}

		//Border
		ctx.beginPath();
		ctx.moveTo(-0.5 + (x + 1) * this.ts, y * this.ts);
		ctx.lineTo(-0.5 + (x + 1) * this.ts, -0.5 + (y + 1) * this.ts);
		ctx.lineTo(x * this.ts, -0.5 + (y + 1) * this.ts);
		ctx.stroke();
		ctx.closePath();

	}

	ctx.restore();

}
