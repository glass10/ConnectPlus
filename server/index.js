const http = require('http');
const port = 3000

var firebase = require('firebase');
var config = require('./config.js');
firebase.initializeApp(config.fbConfig);
firebase.auth().signInWithEmailAndPassword("admin@connectpl.us", config.password);

var responseForm = {
	err: "",
	payload: {}
}

const requestHandler = (request, response) => {
	var parsedUrl = request.url.substring(1).split('/');
	console.log(parsedUrl);
	var routeFunction = routeHandler[parsedUrl[0]];
	if(request.headers.origin){
		response.setHeader("Access-Control-Allow-Origin", request.headers.origin, 'always');
	}
	response.setHeader('Access-Control-Allow-Headers', 'content-type');
	response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
	routeFunction(request,response, parsedUrl);
}

var routeHandler = {
	createUser: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		var body = "";
		req.on('data', function (data) {
			body += data;
			if(body.length > 1e6){ 
				req.connection.destroy();
			}
		});
		req.on('end', function () {
			var data = JSON.parse(body);
			if(!data || !data.uid){
				res.statusCode = 400;
				responseBody.err = "Data or UID not supplied";
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			}
			firebase.database().ref("users/"+data.uid).set(data).then(() => {
				res.statusCode = 200;
				responseBody.payload = data;
				res.write(JSON.stringify(responseBody));
				res.end();
			}).catch((err) => {
				console.error(err);
				responseBody.err = err;
				res.statusCode = 400;
				res.write(JSON.stringify(responseBody));
				res.end();
			})
		});
	},
	updateUser: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		var body = "";
		req.on('data', function (data) {
			body += data;
			if(body.length > 1e6){ 
				req.connection.destroy();
			}
		});

		req.on('end', function () {
			var data = JSON.parse(body);
			if(!data || !data.uid){
				res.statusCode = 400;
				responseBody.err = "Data or UID not provided";
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			}
			firebase.database().ref("users/"+data.uid).update(data).then(() => {
				res.statusCode = 200;
				responseBody.payload = data;
				res.write(JSON.stringify(responseBody));
				res.end();
			}).catch((err) => {
				console.error(err);
				responseBody.err = err;
				res.statusCode = 400;
				res.write(JSON.stringify(responseBody));
				res.end();
			})
		});
	},
	deleteUser: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("users/"+uid).remove().then(() => {
			res.statusCode = 200;
			responseBody.payload = true;
			res.write(JSON.stringify(responseBody));
			res.end();
		}).catch((err) => {
			res.statusCode = 400;
			responseBody.err = err;
			res.write(JSON.stringify(responseBody));
			res.end();
			console.error(err);
		})
	},
	getUser: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("users/"+uid).once("value").then((s) => {
			res.statusCode=200;
			responseBody.payload = s.val();
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}).catch((err) => {
			res.statusCode = 400;
			responseBody.err = err;
			res.write(JSON.stringify(responseBody));
			res.end()
			console.error(err);
		});
	},
	getUsers: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uids = urlData[1].split("&");
		firebase.database().ref("users").once("value").then((s) => {
			var data = [];
			uids.forEach((uid) => {
				if(s.val()[uid])
					data.push(s.val()[uid]);
			})
			if(data.length == 0){
				res.statusCode = 400;
				res.end();
			}
			res.statusCode = 200;
			responseBody.payload = data;
			res.write(JSON.stringify(responseBody));
			res.end();
		}).catch((err) => {
			res.statusCode = 400;
			responseBody.err = err;
			res.write(JSON.stringify(responseBody));
			res.end();
		});
	},
	getAllUsers: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		firebase.database().ref("users").once("value").then((s) => {
			res.statusCode = 200;
			responseBody.payload = s.val();
			res.write(JSON.stringify(responseBody));
			res.end();
		}).catch((err) => {
			res.statusCode = 400;
			responseBody.err = err;
			res.write(JSON.stringify(responseBody));
			res.end();
		})
	},
	getNearbyUsers: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("locations/"+uid).once("value").then((baseLocation) => {
			var c1 = {
				lat: baseLocation.val().lat,
				lon: baseLocation.val().lon
			}
			var p = new Promise((resolve, reject) => {
				firebase.database().ref("locations").once("value").then((s) => {
					res.statusCode=200;
					var nearbyUids = [];
					s.forEach((loc) => {
						var c2 = {
							lat: loc.val().lat,
							lon: loc.val().lon
						};
						var d = getDistance(c1,c2);
						if(d <= 15840 && loc.val().uid != uid){//3 miles
							nearbyUids.push({
								uid: loc.val().uid,
								distance: d,
								lat: loc.val().lat,
								lon: loc.val().lon
							});
						}
					})
					resolve(nearbyUids);
				}).catch((err) => {
					reject(err);
				});
			}).then((closeUsers) => {
				firebase.database().ref("users").once("value").then((users) => {
					var data = [];
					closeUsers.forEach((closeUser) => {
						//Nirali fix the spelling of visibility
						if(users.val()[closeUser.uid] && (users.val()[closeUser.uid]).visibility == 100){
							data.push(users.val()[closeUser.uid]);
							data[data.length-1].distance = closeUser.distance;
							data[data.length-1].lat = closeUser.lat;
							data[data.length-1].lon = closeUser.lon;
						}
					})
					if(data.length == 0){
						res.statusCode = 400;
						res.end();
						return;
					}
					res.statusCode = 200;
					responseBody.payload = data;
					res.write(JSON.stringify(responseBody));
					res.end();
				})
			}).catch((err) => {
				res.statusCode = 400;
				responseBody.err = err;
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			})
		})
	},
	getFacebookFriends: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("facebook-friends/"+uid).once("value").then((user) => {
			var userFriends = user.val().friends;
			var data = [];
			//var friendMap = new Map();
			userFriends.forEach((friend) => {
				data.push(friend.name);

			});

			res.statusCode = 200;
			responseBody.payload = data;
			res.write(JSON.stringify(responseBody));
			res.end();
		});
	},
	getTwitterFollowees: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("twitter-followees/"+uid).once("value").then((user) => {
			if(!user){
				res.statusCode = 400;
				responseBody.err = "No Twitter Users Found";
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			}
			var userFollowees = user.val().friends;
			var data = [];
			//var friendMap = new Map();
			userFollowees.forEach((followee) => {
				data.push(followee);

			});

			res.statusCode = 200;
			responseBody.payload = data;
			res.write(JSON.stringify(responseBody));
			res.end();
		});
	},
	getUsersWithCommonFacebookFriends: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("facebook-friends/"+uid).once("value").then((user) => {
			var userFriends = user.val().friends;
			var friendMap = new Map();
			userFriends.forEach((friend) => {

				friendMap.set(friend.name, friend.name);
			});

			var p = new Promise((resolve, reject) => {
				firebase.database().ref("facebook-friends").once("value").then((s) => {
					res.statusCode=200;
					var commonFriendUIDs = [];
					s.forEach((nextUser) => {
						var matchFriends = nextUser.val().friends;
						console.log(nextUser.val().uid);
						var commonFriend = false;
						matchFriends.forEach((friend) => {
							console.log(friend);
							console.log(friend.id);
							console.log(friendMap.get(friend.name));
							//console.log(friendMap);
							if(friendMap.get(friend.name)){
								commonFriend = true;
							}
						})
						/*
						for(friend in matchFriends){
							console.log(friend);

							if(friendMap.get(friend)){
								commonFriend = true;
								break;
							}
						}
						*/
						if(commonFriend && nextUser.val().uid != uid){//3 miles
							firebase.database().ref("locations/" + nextUser.val().uid).once("value").then((matchLocation) => {
								commonFriendUIDs.push({
									uid: matchLocation.val().uid,
									lat: matchLocation.val().lat,
									lon: matchLocation.val().lon
								});	
							});
							
						}
					});
					resolve(commonFriendUIDs);
				}).catch((err) => {
					reject(err);
				});
			}).then((closeUsers) => {
				firebase.database().ref("users").once("value").then((users) => {
					var data = [];
					closeUsers.forEach((closeUser) => {
						if(users.val()[closeUser.uid]){
							data.push(users.val()[closeUser.uid]);
							data[data.length-1].distance = closeUser.distance;
							data[data.length-1].lat = closeUser.lat;
							data[data.length-1].lon = closeUser.lon;
						}
					})
					if(data.length == 0){
						console.log("No matches were found");
						res.statusCode = 400;
						res.end();
						return;
					}
					console.log(data);
					res.statusCode = 200;
					responseBody.payload = data;
					res.write(JSON.stringify(responseBody));
					res.end();
				})
			}).catch((err) => {
				console.log(err);
				res.statusCode = 400;
				responseBody.err = err;
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			})
		})
	},
	storeLocation: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		var body = "";
		req.on('data', function (data) {
			body += data;
			if(body.length > 1e6){ 
				req.connection.destroy();
			}
		});
		req.on('end', function () {
			var data = JSON.parse(body);
			if(!data || !data.uid){
				res.statusCode = 400;
				responseBody.err = "Data or UID not supplied";
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			}
			firebase.database().ref("locations/"+data.uid).set(data).then(() => {
				res.statusCode = 200;
				responseBody.payload = data;
				res.write(JSON.stringify(responseBody));
				res.end();
			}).catch((err) => {
				console.error(err);
				responseBody.err = err;
				res.statusCode = 400;
				res.write(JSON.stringify(responseBody));
				res.end();
			})
		});
	},

	storeFacebookFriends: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		var body = "";
		// console.log(req);
		req.on('data', function(data){
			body += data;
			if(body.length > 1e6){ 
				req.connection.destroy();
			}
		});
		req.on('end', function() {
			var data = JSON.parse(body);
			if(!data || !data.uid){
				res.statusCode = 400;
				responseBody.err = "Data or UID not supplied";
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			}
			firebase.database().ref("facebook-friends/" + data.uid).set(data).then(() => {
				res.statusCode = 200;
				responseBody.payload = data;
				res.write(JSON.stringify(responseBody));
				res.end();
			}).catch((err) => {
				console.error(err);
				responseBody.err = err;
				res.statusCode = 400;
				res.write(JSON.stringify(responseBody));
				res.end();
			})
		});
	},
	storeTwitterFollowees: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		var body = "";
		// console.log(req);
		req.on('data', function(data){
			body += data;
			if(body.length > 1e6){ 
				req.connection.destroy();
			}
		});
		req.on('end', function() {
			var data = JSON.parse(body);
			if(!data || !data.uid){
				res.statusCode = 400;
				responseBody.err = "Data or UID not supplied";
				res.write(JSON.stringify(responseBody));
				res.end();
				return;
			}
			firebase.database().ref("twitter-followees/" + data.uid).set(data).then(() => {
				res.statusCode = 200;
				responseBody.payload = data;
				res.write(JSON.stringify(responseBody));
				res.end();
			}).catch((err) => {
				console.error(err);
				responseBody.err = err;
				res.statusCode = 400;
				res.write(JSON.stringify(responseBody));
				res.end();
			})
		});
	},
	getTwitterScreenName(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("twitter-followees/"+uid).once("value").then((s) => {
			res.statusCode=200;
			responseBody.payload = s.val();
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}).catch((err) => {
			res.statusCode = 400;
			responseBody.err = err;
			res.write(JSON.stringify(responseBody));
			res.end()
		});
	},
	getLocation: function(req, res, urlData){
		var responseBody = Object.create(responseForm);
		if(!urlData || !urlData[1]){
			res.statusCode = 400;
			responseBody.err = "No UID provided";
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}
		var uid = urlData[1];
		firebase.database().ref("locations/"+uid).once("value").then((s) => {
			res.statusCode=200;
			responseBody.payload = s.val();
			res.write(JSON.stringify(responseBody));
			res.end();
			return;
		}).catch((err) => {
			res.statusCode = 400;
			responseBody.err = err;
			res.write(JSON.stringify(responseBody));
			res.end()
		});
	},
}

function getDistance(locOne, locTwo){
	var lat1 = locOne.lat;
	var lon1 = locOne.lon;
	var lat2 = locTwo.lat;
	var lon2 = locTwo.lon;
	var r = 6371e3;
	var φ1 = toRad(lat1);
	var φ2 = toRad(lat2);
	var Δφ = toRad((lat2-lat1));
	var Δλ = toRad((lon2-lon1));

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = (r * c)*3.28084;
	return d;
}

function toRad(Value) {
	return Value * Math.PI / 180;
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
	if(err){
		return console.log('something bad happend', err);
	}
	console.log('server is listening on', port);
	
})