var ACS = require('acs-node');
ACS.init('VkqmqNRXbjTeXXzP8DQhTiiSTNFE20PH');

// initialize app
function start (app , express) {
	app.use(express.cookieParser());
	app.use(express.json());
	// to support JSON-encoded bodies
	app.use(express.urlencoded());
	// to support URL-encoded bodies

	app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
	//set favicon

	app.use(express.session({
		key: 'node.acs' ,
		secret: "HhIXVoaTnqMCr4Qi25GfLJivWSawTCbc"
	}));
}

// release resources
function stop () {

}