var ACS = require('acs-node');
var moment = require('moment');
var adminUserId = "536cf0421316e90da82c8fd1";
var MAX_NUMBER_PARTICIPANTS = 3;

function list (req , res) {
	ACS.Events.query({
		sel: JSON.stringify({
			"all": ["id" , "name" , "start_time" , "place" , "place.name" , "user" , "user.id" , "user.username" , "participants"]
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
			"all": ["id" , "name" , "start_time" , "place" , "place.name" , "user" , "user.id" , "user.username" , "participant_0" , "participant_1" , "participant_2" , "participants"]
		}) ,
		where: JSON.stringify({
			"$or": [{
				place_id: req.query.office_id
			} , {
				participant_0: req.session.user.id
			} , {
				participant_1: req.session.user.id
			} , {
				participant_2: req.session.user.id
			} , {
				user_id: req.session.user.id
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
							for (var i = 0 ; i < MAX_NUMBER_PARTICIPANTS - 1 ; i++) {
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

	ACS.Events.query({

		start_time: moment(req.body.start_time).format("YYYY-MM-DDThh:mm:00") ,
		place_id: req.body.place_id

	} , function (e) {
		if (e.success) {
			var matchingLunchDateFound = false;
			var events = e.events;

			if (events.length > 0) {
				for (var i = 0 ; i < events.length ; i++) {
					// manually filter the number of participants. check if <= 2
					// and not already participant
					if (!matchingLunchDateFound && events [i].custom_fields.participants.length < 2) {
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

			//no matching lunch date found. create a new one.
			ACS.Events.create({
				name: req.body.name ,
				start_time: moment(req.body.start_time).format("YYYY-MM-DDThh:mm:00") ,
				place_id: req.body.place_id ,
				custom_fields: JSON.stringify({
					participants: [] ,
					participant_0: "" ,
					participant_1: "" ,
					participant_2: ""
				})

			} , function (e2) {
				if (e2.success) {
					res.send({
						"event": e2.events [0] ,
						status: "OK"
					});
					console.log(JSON.stringify(e2));
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
					event_id: req.body.id,
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
		} else {
		    console.log(JSON.stringify(e));
		}
	} , req , res);
}

