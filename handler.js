
const chalk = require('chalk');

module.exports = class EventHandler {

	constructor (tree, io) {
		this.tree = tree;
		this.io = io;
	}

	connect (socket) {
		console.log(chalk.green('A player connected.'));

		socket.emit('connect', socket.id);

		socket.on('disconnect', this.disconnect.bind(this, socket));
		socket.on('join', this.join.bind(this, socket));
		socket.on('dm', this.dm.bind(this, socket));
		socket.on('fow', this.FoW.bind(this, socket));
		socket.on('cl', this.chColor.bind(this, socket));
	}

	isDM (socket) { return this.resolveSocket(socket).id === this.tree.DM }

	getSocket (id) { return this.io.sockets.connected[id] }

	//Socket or socket ID
	resolveSocket (id) { return (typeof id === 'object' ? id : this.getSocket(id)) }

	disconnect (socket) {
		if(socket.id === this.tree.DM) {
			this.tree.DM = null;
			console.log(chalk.blue('The DM disconnected.'));
		} else {
			console.log(chalk.green('A player disconnected.'));
		}
	}

	join (socket) {
		socket = this.resolveSocket(socket);
		socket.join('game');
		this.sendMapTo(socket);
	}

	//Dungeon Master login, sets the game's DM if successful
	//Emits 'dmy' on success and 'dmn' on failure with no data
	dm (socket, password) {
		socket = this.resolveSocket(socket);

		if(password === this.tree.password) {

			console.log(chalk.blue('The DM logged in.'));

		} else {

			socket.emit('dmn');
			console.log(chalk.yellow(
				'User ' + socket.id + ' botched the DM login. Use `/kick ' + socket.id
				 + '` to kick them in the chat if they persist, or use `/mute yellow` '
				 + 'to stop seeing these messages.'
			));

			return;

		}

		//If they logged in successfully execution will reach this point
		this.join(socket);
		this.tree.DM = socket.id;
		socket.emit('dmy');
	}

	//Fog of War toggle, dm only
	FoW (socket, i) {
		if(!this.isDM(socket))
		 	return;

		this.tree.map.toggleFoW(i);
	}

	//Change tile colour
	chColor (socket, i, color) {
		if(!this.isDM(socket))
		 	return;

		this.tree.map.changeColor(i, color);
	}

	kick (socket) {
		socket = this.resolveSocket(socket);
		if(this.isDM(socket))
			return;

		socket.leave('room');
		socket.emit('kick');
	}

	sendMapTo (socket) {
		socket = this.resolveSocket(socket);
		socket.emit('init', this.tree.map.initMapData());
	}

}
