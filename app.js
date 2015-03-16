var ACS = require('acs-node');
//development acs key: VkqmqNRXbjTeXXzP8DQhTiiSTNFE20PH
ACS.init('4vDZEnam2czuezEuJ0Rh2JJNdgBn52tM');

var moment = require("moment");

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
		//secret: "HhIXVoaTnqMCr4Qi25GfLJivWSawTCbc",//  dev
		secret: "1uVeJm29HMBosDLP4aHEyrt6o6l0m3PJ" //  production
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
				"all": ["id" , "name" , "start_time" , "place" , "place.name", "place.latitude", "place.longitude" , "status" , "user" , "user.id" , "user.username" , "participants"]
			}) ,
			session_id: global.adminUserSession
		} , function (e) {
			if (e.success) {
			    console.log("events = " + JSON.stringify(e.events));
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
					if (minutes < 20) {
						var pushIds = [];

						for (var j = 0 ; j < event.custom_fields.participants.length ; j++) {
							pushIds.push(event.custom_fields.participants [j].id);
						}

						console.log("push notification IDs = " + JSON.stringify(pushIds));

						ACS.PushNotifications.notify({
							channel: 'appointments' ,
							payload: JSON.stringify({
								"alert": 'Mix&Match-Essen um ' + moment(event.start_time).utcOffset(1).format('HH:mm') + ' bei ' + event.place.name + ' beginnt gleich!' ,
								"sound": "notification.wav",
								"vibrate": true
							}) ,
							to_ids: pushIds.join(",") ,
							session_id: global.adminUserSession
						} , function (e2) {
							if (e2.success) {
								//alert('Success');
								console.log("push notification to " + JSON.stringify(pushIds) + " sent successfully.");
							}
							else {
								//alert('Error:\n' + ( (e.error && e.message) ||
								// JSON.stringify(e)));
								console.log("sending push notification failed: " + JSON.stringify(e2));
							}
						});

						for (var j = 0 ; j < event.custom_fields.participants.length ; j++) {
							console.log(JSON.stringify(event.custom_fields));
							var email = event.custom_fields.participants [j].email;
							var name = event.custom_fields.participants [j].name;

							ACS.Emails.send({
								template: 'reminder' ,
								from: "mixnmatch@thomas-reinberger.de" ,
								recipients: email ,
								first_name: name,
								date: moment(event.start_time).utcOffset(1).format('HH:mm'),
								canteen:event.place.name,
								latitude:event.place.latitude,
								longitude:event.place.longitude
								
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