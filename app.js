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
		login: 'admin@thomas-reinberger.de' ,
		password: '1qayxsw2'
	} , function (data) {
		console.log('Admin Login session is: ' + data.meta.session_id);
		global.adminUserSession = data.meta.session_id;
	});

	var schedule = require('node-schedule');

	var rule = new schedule.RecurrenceRule ();
    rule.minute = new schedule.Range (0 , 59 , 5);

	schedule.scheduleJob(rule , function () {
		console.log("scheduler job started ...");
		ACS.Events.query({
			sel: JSON.stringify({
				"all": ["id" , "name" , "start_time" , "place" , "place.name" , "status" , "user" , "user.id" , "user.username" , "participants"]
			}) ,
			session_id: global.adminUserSession
		} , function (e) {
			console.log(JSON.stringify(e));
			if (e.success) {
				for (var i = 0 ; i < e.events.length ; i++) {
					var event = e.events [i];
					var status = event.custom_fields.status;
					if (status != "open")
						continue;
					var start_time = new Date (event.start_time);
					var now = new Date ();
					var diff = start_time - now;
					if (diff < 0)
						continue;
					var minutes = Math.floor( (diff / 1000) / 60);
					//send mail to participants when event is due in < 20 minutes
					if (minutes < 60) {
						for (var j = 0 ; j < event.custom_fields.participants.length ; j++) {
							var email = event.custom_fields.participants [i].email;
							var name = event.custom_fields.participants [i].name;
							ACS.Emails.send({
								template: 'reminder' ,
								from: "mixnmatch@thomas-reinberger.de" ,
								recipients: email ,
								first_name: name
							} , function (e) {
								if (e.success) {
									console.log("register email successfully sent.");
								}
								else {
									console.log('Error:\n' + ( (e.error && e.message) || JSON.stringify(e)));
								}
							});
						}

						event.custom_fields.status = "closed";
						ACS.Events.update({
							event_id: event.id ,
							session_id: global.adminUserSession ,
							custom_fields: event.custom_fields
						} , function (e2) {
							console.log(JSON.stringify(e2));
						});
					}
				}
			}
		});
	});

}

// release resources
function stop () {

}