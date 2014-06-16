var ACS = require('acs-node');
ACS.init('VkqmqNRXbjTeXXzP8DQhTiiSTNFE20PH');

global.adminUserSession = "";

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
	
	ACS.Users.login({
        login: 'admin@thomas-reinberger.de',
        password: '1qayxsw2'
    }, function(data) {
        console.log('Admin Login session is: ' + data.meta.session_id);
        global.adminUserSession = data.meta.session_id;
    });
}

// release resources
function stop () {

}