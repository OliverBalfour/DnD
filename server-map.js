
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');

module.exports = class Map {

	constructor (tree, io, w, h) {
		this.tree = tree;
		this.io = io;
		this.w = w;
		this.h = h;
		this.data = [];
		this.icons = [];
		this.reset();
		this.updateIconNames();
		this.saveData();
	}

	reset () {
		this.data = this.emptyTiles(this.w * this.h);
	}

	emptyTile () {
		return {
			c: '#fff',
			v: 0
		}
	}

	//Array of n empty tiles
	emptyTiles (n) {

		let arr = [];

		for(let i = 0; i < n; i++)
			arr.push(this.emptyTile());

		return arr;

	}

	toggleFoW (i) {
		this.data[i].v = this.data[i].v === 1 ? 0 : 1;
		this.io.to('game').emit('u', 'f' + i + this.data[i].v);
		this.saveData();
	}

	toggleSpellEffect (i) {
		this.data[i].e = this.data[i].e === 1 ? 0 : 1;
		this.io.to('game').emit('u', 's' + i + this.data[i].e);
		this.saveData();
	}

	changeIcon (i, icon) {
		this.data[i].i = this.data[i].i === 0 ? icon : 0;
		this.io.to('game').emit('u', 'i' + i + this.data[i].i);
		this.saveData();
	}

	changeColor (i, color) {
		this.data[i].c = color;
		this.io.to('game').emit('u', 'c' + i + ',' + color);
		this.saveData();
	}

	initMapData () {
		return {
			data: this.data,
			w: this.w,
			h: this.h
		};
	}

	sendMap () {
		this.io.to('game').emit('init', this.initMapData());
	}

	updateIconNames () {
		fs.readdir(path.join(__dirname, 'icons'), (err, files) => {
			if(err) console.log(err);
			this.icons = files.map(f => f.substring(0, f.length - '.png'.length));
		});
	}

	newMap (w, h) {
		this.w = w;
		this.h = h;
		this.reset();
		this.sendMap();
	}

	//lw = width to add to top-left
	//rh = height to add to bottom-right
	resize (lw, lh, rw, rh) {

		let extractedData = [];

		for(let i = 0; i < lh; i++)
			extractedData.push( this.emptyTiles(this.w) );

		for(let i = 0; i < this.h; i++) {
			extractedData.push(
				//this.emptyTiles(lw)
					//.concat(
					 this.data.slice(i * this.w, this.w) //)
					//.concat( this.emptyTiles(rw) )
			);
		}

		for(let i = 0; i < rh; i++)
			extractedData.push( this.emptyTiles(this.w) );

		this.w += lw + rw;
		this.h += lh + rh;
		this.data = extractedData.reduce((arr, row) => arr.concat(row), []);

		this.saveData();
		this.sendMap();

	}

	replaceWith (map) {
		this.w = map.w;
		this.h = map.h;
		this.data = map.data;
		this.saveData();
		this.sendMap();
	}

	saveMapAs (name) {
		jsonfile.writeFile(
			path.join(__dirname, 'saves', name + '.json'), this.initMapData()
		);
	}

	sendMapListTo (socket) {
		fs.readdir(path.join(__dirname, 'saves'), (err, files) => {
			if(!err){
				socket.emit('ml', files.map(name => name.replace(/\.json/g, '')));
			}
		});
	}

	sendIconListTo (socket) {
		socket.emit('il', this.icons);
	}

	loadMap (name) {
		jsonfile.readFile(
			path.join(__dirname, 'saves', name + '.json'),
			(err, obj) => {
				if(!err)
					this.replaceWith(obj);
			}
		)
	}

	saveData () {
		jsonfile.writeFile(
			path.join(__dirname, 'autosave', 'save-' + this.tree.password + '.json'),
			this.initMapData(),
			()=>{}
		);
	}

}
