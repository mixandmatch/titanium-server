var ACS = require('acs-node');

function checkUserSession (req , res , next) {
	if (req.session.flash && req.session.flash.r == 0) {
		req.session.flash.r = 1;
	}
	else {
		req.session.flash = {};
	}

	if (req.url === "/user/login" || req.url === "/user/register" || req.url === "/user/resetPwd") {
		next();
	}
	else {
		console.log("Validation user ...");

		ACS.Users.showMe(function (e) {
			if (e.success && e.success === true) {
				var user = e.users [0];
				if (user.first_name && user.last_name) {
					user.name = user.first_name + ' ' + user.last_name;
				}
				else {
					user.name = user.username;
				}
				req.session.user = user;
			}
			else
			if (req.url !== "/") {
				req.session.controller = "";
				console.log('Error: ' + JSON.stringify(e));
				delete req.session.user;
				res.send(401 , {
					error: "Please login first." ,
					status: "ERROR"
				});
				return;
			}
			next();
		} , req , res);
	}
}