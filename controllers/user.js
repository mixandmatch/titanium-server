var ACS = require('acs-node');

function list (req , res) {

	//doesnt' already exist in cache
	console.log("user/list/ new acs request ....");
	ACS.Users.query({
		sel: JSON.stringify({
			"all": ["id" , "username" , "first_name" , "last_name" , "email"]
		}) ,
		page: req.body.page || 1 ,
		per_page: req.body.per_page || 10000 // all?
	} , function (e) {
		if (e.success) {

			res.send({
				users: e.users ,
				status: "OK"
			});

		}
		else {
			res.send(500 , {
				error: e.message ,
				status: "ERROR"
			});
		}
	});

}

function login (req , res) {
	console.log("login request ..." + JSON.stringify(req.body));

	ACS.Users.login({
		// grab data from http post
		login: req.body.username ,
		password: req.body.password
	} , function (data) {
		if (data.success) {
			//res.cookie('_session_id',data.meta.session_id, { maxAge:
			// 900000, httpOnly: true });
			res.send({
				sessionId: data.meta.session_id ,
				status: "OK"
			});
		}
		else {
			console.log(JSON.stringify(data));
			res.send(401 , {
				error: data.message ,
				status: "ERROR"
			});
		}
	} , req , res);
}

function register (req , res) {
	ACS.Users.create({
		username: req.body.username ,
		password: req.body.password ,
		email: req.body.email ,
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		password_confirmation: req.body.password
	} , function (e) {
		var user;
		if (e.success) {
			user = e.users [0];
			res.send(201 , {
				session_id: e.meta.session_id ,
				status: "OK"
			});

			ACS.Emails.send({
				template: 'register' ,
				recipients: req.body.email,
				first_name: req.body.first_name
			} , function (e) {
				if (e.success) {
					console.log("register email successfully sent.");
				}
				else {
					console.log('Error:\n' + ( (e.error && e.message) || JSON.stringify(e)));
				}
			});
		}
		else {
			res.send(500 , {
				error: e.message ,
				status: "ERROR"
			});
		}

	} , req , res);
}

function resetPwd (req , res) {
	ACS.Users.requestResetPassword({
		email: req.body.email
	} , function (e) {
		if (e.success) {
			res.send({
				status: "OK"
			});
		}
		else {
			res.send(500 , {
				error: e.message ,
				status: "ERROR"
			});
		}
	} , req , res);
}
