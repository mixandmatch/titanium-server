var ACS = require('acs-node');
ACS.init('VkqmqNRXbjTeXXzP8DQhTiiSTNFE20PH');

function getPlaces (req , res) {
	console.log("getPlaces ...");
	console.log(JSON.stringify(req.headers));
	ACS.Places.search({

	} , function (e) {
		if (e.success) {
			console.log("Successful!");
			res.send(e.places);
		}
		else {
			res.send(500 , {
				error: e.message
			});
		}
	} , req , res);
}

function getOffices (req , res) {
	console.log("getOffices ...");
	console.log(JSON.stringify(req.headers));
	ACS.Places.query({
	    where: {
	        
	    }
	} , function (e) {
		if (e.success) {
			console.log("Successful!");
			res.send(e.places);
		}
		else {
			res.send(500 , {
				error: e.message
			});
		}
	} , req , res);
}

function login (req , res) {
	console.log("login request ..." + req.body.username);
	console.log(JSON.stringify(req.headers));

	ACS.Users.login({
		// grab data from http post
		login: req.body.username ,
		password: req.body.password
	} , function (data) {
		if (data.success) {
			//res.cookie('_session_id',data.meta.session_id, { maxAge:
			// 900000, httpOnly: true });
			res.send({
				sessionId: data.meta.session_id
			});
		}
		else {
			res.send(401 , {
				error: data.message
			});
		}
	} , req , res);
};
