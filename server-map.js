
const chalk = require('chalk');

module.exports = class Map {

	constructor (io, w, h) {
		this.io = io;
		this.w = w;
		this.h = h;
		this.data = [];
		this.reset();
	}

	reset () {
		for(let i = 0; i < this.w * this.h; i++){
			this.data[i] = {
				c: '#fff',
				v: false
			}
		}
	}

	toggleFoW (i) {
		this.data[i].v = !this.data[i].v;
		this.io.emit('u', 'f' + i + (this.data[i].v ? 1 : 0));
	}

	changeColor (i, color) {
		this.data[i].c = color;
		this.io.emit('u', 'c' + i + ',' + color);
	}

	initMapData () {
		return {
			data: this.data,
			w: this.w,
			h: this.h
		};
	}

}
