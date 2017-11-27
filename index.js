
//D&D Map Tools
//Built with Node, Express and Socket.io w/ uWS (and a few other bits and bobs)

//Copyright Oliver Balfour (aka Tobsta, Lord of the 32bit Ring) 2016-2017

//THERE IS *NO* ERROR HANDLING OR CHECKING FOR FALSE INPUT
//THIS PROGRAM IS NOT DESIGNED TO BE ROBUST NOR WILL IT EVER BE
//THIS PROGRAM IS DESIGNED SOLELY FOR PERSONAL AND NOT PUBLIC USE
//AND WILL NOT BE ALTERED TO SUIT THOSE NEEDS

//MIT Licensed

(function(){
	
	/* Dependencies */
	
	const app = require('express')();
	const http = require('http').Server(app);
	const io = require('socket.io')(http);

	const path = require('path');
	const fs = require('fs');
	
	const chalk = require('chalk');

	const EventHandler = require(path.join(__dirname, 'handler.js'));

	const Map = require(path.join(__dirname, 'server-map.js'));

	/* Routing */
	
	app.get('/', (req, res) => {
		res.sendFile(path.join(__dirname, 'index.html'));
	});
	app.get('/*', (req, res) => {
		res.sendFile(path.join(__dirname, req.path));
	});
	

	/* Data tree */
	
	const tree = {
		password: (Math.floor(Math.random() * 10000) + 1) + '',
		DM: null
	}

	tree.map = new Map(tree, io, 16, 16);

	console.log(chalk.cyan('The DM password for this session is ' + tree.password));
	
	
	/* WebSockets (socket.io) */

	io.engine.ws = new (require('uws').Server)({
		noServer: true,
		perMessageDeflate: false
	});

	const handler = new EventHandler(tree, io);
	
	io.on('connection', function(socket){
		
		handler.connect(socket);
		
	});
	
	
	/* Initialisation */
	
	//If a (valid) port was supplied as a command line parameter (node index PORT_NO) then use it
	//Otherwise, fall back to port 3000
	const port = process.argv[2] ?
				process.argv[2].match(/[^0-9]+/g) ?
					3000 : parseInt(process.argv[2])
			   : 3000;
	
	http.listen(port, function(){
		console.log(chalk.cyan('Loaded to ') + chalk.blue('http://localhost:') + chalk.green.underline(port));
	});
	
})();