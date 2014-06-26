var ACS = require('acs-node');
var moment = require('moment');
var adminUserId = "536cf0421316e90da82c8fd1";
var MAX_NUMBER_PARTICIPANTS = 4;

function list (req , res) {
	ACS.Events.query({
		sel: JSON.stringify({
			"all": ["id" , "name" , "start_time" , "place" , "latitude" , "longitude" , "username" , "status" , "lunchTag" , "participant_0" , "participant_1" , "participant_2" , "participant_3" , "participants"]
		}),

	} , function (e) {
		if (e.success) {
			res.send(e.events);
		}
		else {
			res.send({
				message: JSON.stringify(e) ,
				status: "OK"
			});
		}
	} , req , res);
}

function byId (req , res) {
	console.log(req.params.id);
	ACS.Events.show({
		event_id: req.params.id
	} , function (e) {
		if (e.success) {
			var event = e.events [0];
			res.send(event);
		}
		else {
			res.send(404 , {
				status: "ERROR" ,
				message: "Event not found."
			});
		}
	});
}

function byOffice (req , res) {
	console.log("event:byOffice id=" + req.query.office_id);
	//find all events that take place at the specificed office OR
	// where the user is participant
	ACS.Events.query({
		sel: JSON.stringify({
			"all": ["id" , "name" , "start_time" , "place" , "latitude" , "longitude" , "username" , "status" , "lunchTag" , "participant_0" , "participant_1" , "participant_2" , "participant_3" , "participants"]
		}) ,
		where: JSON.stringify({
			start_time: {
				"$gte": moment()
			} ,
			"$or": [{
				place_id: req.query.office_id
			} , {
				participant_0: req.session.user.id
			} , {
				participant_1: req.session.user.id
			} , {
				participant_2: req.session.user.id
			} , {
				participant_3: req.session.user.id
			}]
		})
	} , function (e) {
		if (e.success) {
			res.send(e.events);
		}
		else {
			res.send({
				message: JSON.stringify(e) ,
				status: "OK"
			});
		}
	} , req , res);
}

function join (req , res) {

	ACS.Events.show({
		event_id: req.params.id
	} , function (e) {
		if (e.success) {
			var event = e.events [0];
			console.log("event.join: participants =" + JSON.stringify(event.custom_fields.participants));
			//check if appointment is in the future and not booked up
			if (moment(event.start_time) > moment()) {
				if (event.user === req.session.user.id) {
					res.send(412 , {
						message: "You can't join a meeting you've set up." ,
						status: "ERROR"
					});
				}
				else {

					var isParticipant = false;
					for (var i = 0 ; i < event.custom_fields.participants.length ; i++) {
						if (event.custom_fields.participants [i].id === req.session.user.id) {
							isParticipant = true;
							break;
						}

					}

					if (isParticipant) {
						res.send(412 , {
							message: "You're already meeting participant." ,
							status: "ERROR"
						});
					}
					else {

						console.log("# participants = " + event.custom_fields.participants.length);
						if (event.custom_fields.participants.length >= MAX_NUMBER_PARTICIPANTS) {
							res.send(412 , {
								message: "The meeting is already booked up." ,
								status: "ERROR"
							});
						}
						else {
							var custom_fields = event.custom_fields;

							custom_fields.participants.push({
								id: req.session.user.id ,
								name: req.session.user.name ,
								photo_id: req.session.user.photo.photo_id ,
								photo_url: req.session.user.photo.urls.square_75
							});

							//add string properties for each participant in order to
							// enable query operations

							//-1 because we'll always have a date initiator
							for (var i = 0 ; i < MAX_NUMBER_PARTICIPANTS ; i++) {
								if (custom_fields.participants [i]) {
									custom_fields ["participant_" + i] = custom_fields.participants [i].id;
								}
								else {
									custom_fields ["participant_" + i] = "";
								}

							}
							console.log("event:join custom_fields = " + JSON.stringify(custom_fields));

							ACS.Events.update({
								event_id: req.params.id ,
								session_id: global.adminUserSession ,
								custom_fields: custom_fields
							} , function (e2) {
								console.log(JSON.stringify(e2));
								res.send({
									status: "OK"
								});
							});
						}
					}
				}
			}
			else {
				res.send(412 , {
					message: "Meeting already took place." ,
					status: "ERROR"
				});
			}
		}
		else {
			res.send(500 , {
				message: e.message ,
				status: "ERROR"
			});
		}
	} , req , res);
}

function leave (req , res) {
	ACS.Events.show({
		event_id: req.params.id
	} , function (e) {
		if (e.success) {
			var event = e.events [0];
			console.log("event.leave: participants =" + JSON.stringify(event.custom_fields.participants));
			//check if appointment is in the future and not booked up
			if (moment(event.start_time) > moment()) {

				var custom_fields = event.custom_fields;

				var indexToRemove = -1;
				for (var i = 0 ; i < custom_fields.participants.length ; i++) {
					if (custom_fields.participants [i].id === req.session.user.id) {
						indexToRemove = i;
						break;
					}
				}

				if (indexToRemove != -1) {
					custom_fields.participants.splice(indexToRemove , 1);
				}

				//-1 because we'll always have a date initiator
				for (var i = 0 ; i < MAX_NUMBER_PARTICIPANTS - 1 ; i++) {
					if (custom_fields.participants [i]) {
						custom_fields ["participant_" + i] = custom_fields.participants [i].id;
					}
					else {
						custom_fields ["participant_" + i] = "";
					}

				}

				ACS.Events.update({
					event_id: req.params.id ,
					session_id: global.adminUserSession ,
					custom_fields: custom_fields
				} , function (e2) {
					console.log(JSON.stringify(e2));
					res.send({
						id: req.params.id ,
						action: "joined" ,
						status: "OK"
					});
				});

			}
			else {
				res.send(412 , {
					message: "Meeting already took place." ,
					status: "ERROR"
				});
			}
		}
		else {
			res.send(500 , {
				message: e.message ,
				status: "ERROR"
			});
		}
	} , req , res);
}

function create (req , res) {

	//TODO check if there is already a lunch date with the same
	// place_id and start_time with at least on free seat.
	// if so, join that lunch date. otherwise, create a lunch
	// date

	var _ = require("underscore");
	var moment = require("moment");

	console.log("searching for existing lunch dates: " + moment(req.body.start_time).format("YYYY-MM-DDThh:mm:00") + " at place_id = " + req.body.place_id);

	ACS.Events.query({

		start_time: moment(req.body.start_time).format("YYYY-MM-DDThh:mm:00ZZ") ,
		place_id: req.body.place_id

	} , function (e) {
		if (e.success) {
			var matchingLunchDateFound = false;
			var events = e.events;

			if (events.length > 0) {
				for (var i = 0 ; i < events.length ; i++) {
					// manually filter the number of participants. check if <= 3
					// and not already participant
					if (!matchingLunchDateFound && events [i].custom_fields.participants.length <= 3) {
						var alreadyParticipating = false;
						//test if the current user isn't already participating
						for (var j = 0 ; j < events [i].custom_fields.participants.length ; j++) {
							if (events [i].custom_fields.participants [j].id === req.session.user.id) {

								alreadyParticipating = true;
							}
						}
						if (!alreadyParticipating) {
							//join
							_.extend(req , {
								params: {
									id: events [i].id
								}
							});

							join(req , res);
							matchingLunchDateFound = true;
						}
					}
				}
			}
		}

		if (!matchingLunchDateFound) {

			var lunchTag;

			ACS.Objects.update({
				id: "53abc7f7924865084b05e59f" ,
				classname: 'counter' ,
				fields: JSON.stringify({
					counter: {
						$inc: 1
					}
				}) ,
				sel: JSON.stringify({
					"all": ["counter"]
				})
			} , function (coe) {
				console.log(coe.counter [0].counter);
				if (coe.success) {
					lunchTag = coe.counter [0].counter;

					console.log("creating event with lunchTag #" + lunchTag);

					//no matching lunch date found. create a new one.
					ACS.Events.create({
						name: req.body.name ,
						start_time: moment(req.body.start_time).format("YYYY-MM-DDThh:mm:00ZZ") ,
						place_id: req.body.place_id ,
						custom_fields: JSON.stringify({
							participants: [{
								id: req.session.user.id ,
								name: req.session.user.name ,
								photo_id: req.session.user.photo.photo_id ,
								photo_url: req.session.user.photo.urls.square_75
							}] ,
							participant_0: req.session.user.id ,
							participant_1: "" ,
							participant_2: "" ,
							participant_3: "" ,
							lunchTag: lunchTag ,
							status: "open"
						})

					} , function (e2) {
						if (e2.success) {
							res.send({
								id: e2.events [0].id ,
								action: "created" ,
								status: "OK"
							});

						}
						else {
							res.send(500 , {
								message: e2.message ,
								status: "ERROR"
							});
							console.log(JSON.stringify(e2));
						}
					} , req , res);
				}
			} , req , res);

		}

	} , req , res);

}

function deleteEvent (req , res) {
	console.log("event.deleteEvent id=" + req.body.id);
	ACS.Events.show({
		event_id: req.body.id
	} , function (e) {
		if (e.success) {
			var event = e.events [0];

			//if (event.user === req.session.user.id) {
			if (true) {
				// you're only allowed to delete an event if you're the
				// organisator
				console.log("about to remove event ...");
				ACS.Events.remove({
					event_id: req.body.id ,
					session_id: global.adminUserSession
				} , function (e2) {
					console.log(JSON.stringify(e2));
					res.send(200);

				});
			}
			else {
				console.log("Event doesn't belong to requesting user. cancelling.");
				res.send(412 , {
					message: e.message ,
					status: "ERROR"
				});
			}
		}
		else {
			console.log(JSON.stringify(e));
		}
	} , req , res);
}

function mixParticipants (req , res) {
	//find all events for a specific date and time and location
	//mix the participants
	//close the boarding gate for that event
	//send out emails and/or icals to the participants
	var _ = require("underscore");

	console.log("mixParticipants ...");
	ACS.Places.query({
		type: "canteen"
	} , function (e) {

		if (e.success) {

			//iterate all canteens
			for (var i = 0 ; i < e.places.length ; i++) {

				ACS.Events.query({
					id: e.places [i].id
				} , function (e2) {

					if (e2.success) {

						var participants = [];

						var participantArrays = _.map(e2.events , function (evt) {
							return evt.custom_fields.participants;
						});

						//console.log("participantArrays = " +
						// JSON.stringify(participantArrays));

						for (var j = 0 ; j < participantArrays.length ; j++) {
							for (var k = 0 ; k < participantArrays [j].length ; k++) {
								participants.push(participantArrays[j] [k]);
							}
						}

						//mix participants and distribute them over the
						// existing events. remove all other events

						//get random array of participants:
						participants = _.shuffle(participants);

						//re-distribute randomized participants over events
						for (var l = 0 ; l < e2.events.length ; l++) {
							var event = e2.events [l];
							var custom_fields = event.custom_fields;
							custom_fields.participants = [];
							for (var m = 0 ; m < 4 ; m++) {
								if (participants.length > 0) {
									var participant = participants.shift();
									custom_fields.participants.push(participant);
									if (m == 0) {
										custom_fields.participant_0 = participant;
									}
									else
									if (m == 1) {
										custom_fields.participant_1 = participant;
									}
									else
									if (m == 2) {
										custom_fields.participant_2 = participant;
									}
									else {
										custom_fields.participant_3 = participant;
									}
								}
							}

							//get rid of empty events
							if (custom_fields.participants.length == 0) {
								delete e2.events [l];
							}
							else {
								ACS.Events.update({
									event_id: event.id ,
									session_id: global.adminUserSession ,
									custom_fields: custom_fields
								} , function (e2) {
									console.log(JSON.stringify(e2));
									res.send({
										status: "OK"
									});
								});
							}
						}
						res.send(participants);
					}
				} , req , res);

			}
		}
	} , req , res);

}

function deleteAll (req , res) {

	ACS.Users.login({
		login: 'info@thomas-reinberger.de' ,
		password: '1qayxsw2'
	} , function (data) {
		console.log(JSON.stringify(data));

		var myData = JSON.stringify({
			session_id: data.meta.session_id
		});

		var http = require('https');

		var options = {
			host: 'api.cloud.appcelerator.com' ,
			path: '/v1/events/admin_batch_delete.json?key=VkqmqNRXbjTeXXzP8DQhTiiSTNFE20PH' ,
			port: '443' ,
			method: 'DELETE' ,
			//This is the only line that is new. `headers` is an object
			// with the headers to request
			headers: {
				'content-type': 'application/json' ,
				'Content-Length': myData.length
			}
		};

		var callback = function (response) {
			var str = '';
			response.on('data' , function (chunk) {
				str += chunk;
			});

			response.on('end' , function () {
				console.log(str);
			});
		};

		var request = http.request(options , callback);
		request.write(myData);
		request.end();
	});
}