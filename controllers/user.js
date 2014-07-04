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

	console.log("req.headers = " + JSON.stringify(req.headers));

	var fs = require("fs");

	var tempfile = new Date ().getTime() + "_temp.png";

	try {

		fs.writeFileSync(tempfile , req.body.photo , 'base64' , function (err) {
			console.log(err);
		});

		ACS.Users.create({
			username: req.body.username ,
			password: req.body.password ,
			email: req.body.email ,
			first_name: req.body.first_name ,
			last_name: req.body.last_name ,
			password_confirmation: req.body.password ,
			photo: tempfile
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
					from: "mixnmatch@thomas-reinberger.de" ,
					recipients: req.body.email ,
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
				console.log(JSON.stringify(e));

				res.send(500 , {
					error: e.message ,
					status: "ERROR"
				});
			}

		} , req , res);
	}
	catch(err) {
		console.log(JSON.stringify(err));
	}
	finally {
		if (fs.existsSync(tempfile)) {

			fs.unlink(tempfile , function (err) {
				if (err)
					console.log(err);
				console.log('successfully deleted : ' + tempfile);
			});
		}
	}

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

function submitIssue (req , res) {
	var GitHubApi = require("github");

	var github = new GitHubApi ({
		// required
		version: "3.0.0" ,
		// optional
		timeout: 5000
	});

	ACS.Objects.show({
		classname: 'config' ,
		ids: ["53b6716502cabd0826050985"]
	} , function (e) {
		if (e.success) {
		    //temporary solution. oAuth preferred
			github.authenticate({
				type: "basic" ,
				username: e.config[0].username ,
				password: e.config[0].password
			});

			github.issues.create({
			    user:"mixandmatch",
			    repo:"titanium",
			    title:"Problem report",
			    body:req.body.content,
			    labels: []
			} , function (e2) {
			    console.log(JSON.stringify(e2));
				res.send(200 , {
					status: "OK"
				});
			});
		}
		else {
			res.send(500 , {
				status: "ERROR" ,
				description: JSON.stringify(e)
			});
		}
	}, req, res);

}
