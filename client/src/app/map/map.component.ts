import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ParticlesConfigService } from '../services/particles-config.service';
import { User } from '../services/user';
import { Commonalities } from '../services/commonalities';
import { DatabaseService } from '../services/database.service';
import { LocationService } from '../services/location.service';
import { ClassesService } from '../services/classes.service';

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
	lat: number = this.lat;
	lng: number = this.lng;

	editMood = false;
	editRange = false;
	viewBroadcasts = false;
	newBroadcast = false;
	filterBroadcast = false;

	viewMessages = false;

	testArray = [1, 2, 3, 4, 5, 6]

	selectedBroadcast: any = {};
	broadcastText = "";
	responseText = "";
	broadcasts = [];
	broadcastResponses = [];
	nearbyUsers = [];
	filteredUsers = [];
	displayedUser: any = {};
	facebookCommon: number = 0;
	twitterCommon: number = 0;
	blackboardCommon: number = 0;
	youtubeCommon: number = 0;

	interestObject: any = {};
	interestKeys = [];

	currentFilter = "";
	currentFilterArray = [];

	broadcastCategory = "";
	broadInterests = [];
	broadClasses = [];

	commonMap = new Map();
	CommonUsersList = [];
	CommonUsersListtemp = [];
	temp;
	holder;

	refreshMap() {
		this.auth.getUser().then((u) => {
			this.db.getNearbyUsers(u.uid).then((nearbyUsers) => {
				console.log("Nearby:", nearbyUsers);
				this.generateCommonMap();
				this.nearbyUsers = nearbyUsers;
				//this.filteredUsers = nearbyUsers; //copy of users for filtering ONLY
				this.maintainFilter();

			}).catch((err) => {
				console.error(err);
			})
		})
	}

	toggleMood() {
		this.editMood = !this.editMood;
	}

	toggleRange() {
		this.editRange = !this.editRange;
	}

	toggleBroadcasts() {
		this.viewBroadcasts = !this.viewBroadcasts;
		if (this.viewMessages) {
			this.viewMessages = false;
		}

		this.db.getInterests(this.model.user.uid).then((interests) => {
			this.interestObject = interests;
			this.interestKeys = Object.keys(this.interestObject);
			console.log(this.interestKeys)
			//this.getArrayOfInterestKeys();
		}).catch((err) => {
			console.log(err);
		})

		this.db.getClasses(this.model.user.uid).then((classes) => {
			this.broadInterests = classes;
		}).catch((err) => {
			console.log(err);
		})
	}

	toggleMessages() {
		this.viewMessages = !this.viewMessages;
		if (this.viewBroadcasts) {
			this.viewBroadcasts = false;
		}
	}

	toggleNewBroadcast() {
		this.newBroadcast = !this.newBroadcast;
		if (this.filterBroadcast) {
			this.filterBroadcast = false;
		}
	}

	toggleFilterBroadcast() {
		this.filterBroadcast = !this.filterBroadcast;
		if (this.newBroadcast) {
			this.newBroadcast = false;
		}
	}

	updateBroadInterests(){
		if(this.broadcastCategory != 'blackboard'){
			this.broadInterests = Object.values(this.interestObject[this.broadcastCategory]);
		}
		else{
			this.broadInterests = this.broadClasses;
		}
		
		console.log("UpdateBroadInterests")
	}

	model = {
		user: new User(),
		moodStatus: "",
		// filterSports: false,
		// filterMusic: false,
		// filterFood: false,
		// filterFacebook: false,
		// filterTwitter: false,
		// filterLinkedIn: false,
		// filterBlackBoard: false
	}
	errors = {
		mood: ""
	}

	commonalities = {
		commonalities: new Commonalities(),
	}



	MoodStatus = "Mood Status";

	moodChange() {
		console.log(this.model);
		this.model.user.moodStatus = this.model.moodStatus;
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				this.errors.mood = "Your mood status has been updated!"
				localStorage.setItem("localMood", this.model.user.moodStatus);
			}).catch((err) => {
				console.error(err);
				this.errors.mood = "Your mood status has NOT been updated!"

				//Form rejected for some reason
			})
		});


	}

	//ZOOM VALUE FOR MAP
	zoom: number = 15;
	currentZoom: number = 15;

	zoomMap() {
		this.zoom = this.currentZoom;

	}

	userVisible = false;
	vis;
	viewUser(user: any = {}) {
		this.userVisible = true;
		this.displayedUser = user;
		this.displayedUser.distanceInMiles = Math.round((this.displayedUser.distance / 5280) * 100) / 100;
		if (isNaN(this.displayedUser.distanceInMiles))
			this.displayedUser.distanceInMiles = 0;
		this.vis = this.commonMap.get(user.uid);

		this.displayedUser.commons = this.vis.FB + ": " + this.vis.facebookNum
			+ "  " + this.vis.TW + ": " + this.vis.twitterNum
			+ "  " + this.vis.BB + ": " + this.vis.blackboardNum
			+ "  " + this.vis.YT + ": " + this.vis.youtubeNum
	}

	closeUser() {
		this.userVisible = false;
	}

	filterVisible = false;

	viewFilter() {
		this.filterVisible = true;
	}

	filterSports = false;
	filterMusic = false
	filterFood = false
	filterFacebook = false
	filterTwitter = false
	filterLinkedIn = false
	filterBlackBoard = false

	closeFilter() {
		this.filterVisible = false;
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);

			}).catch((err) => {
				console.error(err);

			})

		});
	}

	toggleFilter() {
		this.filterVisible = true;
		if (this.filterVisible) {
			this.db.getInterests(this.model.user.uid).then((interests) => {
				this.interestObject = interests;
				this.interestKeys = Object.keys(this.interestObject);
				console.log(this.interestKeys)
				//this.getArrayOfInterestKeys();
			}).catch((err) => {
				console.log(err);
			})
		}
	}

	nearbyPin = ("../../assets/NearbyPin.png");
	userPin = ("../../assets/UserPin.png");

	//Invisibility Toggle 0=Invisible, 4hour, 12hour, 24hour, 100=Visible
	visibility;
	// visibility = this.model.user.visability;
	setVisible(number) {

		this.visibility = number;
		this.model.user.visibility = number;
		localStorage.setItem("localVisibility", number);


		this.auth.getUser().then((user) => {
			//this.model.user.uid = user.uid;
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				//this.success.changeInfoS = "Your information has been updated!"
				//this.router.navigateByUrl('map');
			}).catch((err) => {
				console.error(err);
				//this.errors.changeInfoE = "Your information has NOT been updated!"
				//Form rejected for some reason
			})
			//this.success.changeInfoS = "Your information has been updated!"
		});



	}

	addFilter() {
		if (this.currentFilterArray.indexOf(this.currentFilter) == -1) {
			this.currentFilterArray.push(this.currentFilter);
		}

		console.log("Filter Added: " + this.currentFilter);
		if (this.currentFilter == "Facebook") {
			this.model.user.filterFacebook = true;
			this.facebookFilter()
		}
		else if (this.currentFilter == "Twitter") {
			this.model.user.filterTwitter = true;
			this.twitterFilter();
		}
		else if (this.currentFilter == "Youtube") {
			this.model.user.filterYoutube = true;
			this.youtubeFilter();
			//do something eventually
		}
		else if (this.currentFilter == "Blackboard") {
			this.model.user.filterBlackBoard = true;
			this.blackboardFilter();
		}
		else {
			//interest filtering
			this.model.user.filteredInterests.push(this.currentFilter);
			this.filterUsersBasedOnInterests(this.currentFilter);
		}
	}

	removeFilter(filter) {
		console.log("Filter Removed: " + filter);
		// var index = this.currentFilterArray.indexOf(filter);
		// this.currentFilterArray.splice(index, 1);
		if (filter == "Facebook") {
			this.model.user.filterFacebook = false;
			this.maintainFilter();
		}
		else if (filter == "Twitter") {
			this.model.user.filterTwitter = false;
			this.maintainFilter();
			// this.twitterFilter();
		}
		else if (filter == "Youtube") {
			this.model.user.filterYoutube = false;
			this.maintainFilter();
		}
		else if (filter == "Blackboard") {
			this.model.user.filterBlackBoard = false;
			this.maintainFilter();
			// this.blackboardFilter();
		}
		else {
			//interest filtering
			var index = this.model.user.filteredInterests.indexOf(filter);
			this.model.user.filteredInterests.splice(index, 1);
			this.maintainFilter();
		}
	}

	facebookFilter() {
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log("from facebook filter ", data);

				if (this.model.user.filterFacebook) {
					this.filterUsersBasedOnFacebook(0);

				}
				else {
					this.maintainFilter();
				}

			}).catch((err) => {
				console.error(err);
			})
		});
	}
	twitterFilter() {
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);

				if (this.model.user.filterTwitter) {
					this.filterUsersBasedOnTwitter(0);
				}
				else {
					this.maintainFilter();
				}

			}).catch((err) => {
				console.error(err);
			})
		});
	}
	youtubeFilter() {
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);

				if (this.model.user.filterYoutube) {
					this.filterUsersBasedOnYoutube(0);
				}
				else {
					this.maintainFilter();
				}

			}).catch((err) => {
				console.error(err);

			})

		});
	}
	blackboardFilter() {
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);

				if (this.model.user.filterBlackBoard) {
					this.filterUsersBasedOnBlackboard(0);
				}
				else {
					this.maintainFilter();
				}

			}).catch((err) => {
				console.error(err);

			})

		});
	}

	maintainFilter() {
		//this.generateCommonMap();
		this.filteredUsers = this.nearbyUsers;
		this.currentFilterArray = [];
		var count = 0;

		if (this.model.user.filterFacebook) {
			this.currentFilterArray.push("Facebook");
			this.filterUsersBasedOnFacebook(0);
			count++;
		}
		if (this.model.user.filterTwitter) {
			this.currentFilterArray.push("Twitter")
			this.filterUsersBasedOnTwitter(0);
			count++;
		}
		if (this.model.user.filterYoutube) {
			this.currentFilterArray.push("Youtube")
			this.filterUsersBasedOnYoutube(0);
			count++;
		}
		if (this.model.user.filterBlackBoard) {
			this.currentFilterArray.push("Blackboard")
			this.filterUsersBasedOnBlackboard(0);
			count++;
		}

		if (this.model.user.filteredInterests.length != 0) {
			for (var i = 0; i < this.model.user.filteredInterests.length; i++) {
				if (this.model.user.filteredInterests[i] != "") {
					this.currentFilterArray.push(this.model.user.filteredInterests[i]);
					this.filterUsersBasedOnInterests(this.model.user.filteredInterests[i]);
					count++;
				}
			}
		}

		if (count == 0) {
			this.filteredUsers = this.nearbyUsers;
		}
	}

	particlesConfig;
	submitted = false;


	localStorage() {
		localStorage.setItem("localVisibility", String(this.visibility));
		localStorage.setItem("localMood", this.model.user.moodStatus);
	}


	constructor(private auth: AuthService, public pConfig: ParticlesConfigService, private router: Router, private db: DatabaseService, public loc: LocationService) {


		this.auth.isAuthed().then((user) => {
			console.log("Authed:", user)
			this.model.user.uid = user.uid;
		});


		this.auth.getUser().then((user) => {

			//this.localStorage();
			this.db.getUser(user.uid).then((userData) => {
				this.model.user = userData;

				this.visibility = localStorage.getItem("localVisibility");
				this.model.moodStatus = localStorage.getItem("localMood");
				console.log(userData)
			})
			this.generateCommonMap();

		});

		this.auth.getUser().then((user) => {
			if (localStorage.getItem("localVisibility") == null || localStorage.getItem("localMood") == null) { //only call Database if necessary
				this.db.getUser(user.uid).then((userData) => {
					console.log("localStorage Missing");
					this.model.user = userData;
					console.log(userData)
					this.visibility = this.model.user.visibility;
					this.model.moodStatus = userData.moodStatus;
					this.localStorage();
					this.generateCommonMap();
				})
			}
		});
		loc.getLocation().then((l) => {
			console.log("reeeeeeeeeee")
			auth.getUser().then((u) => {
				db.storeLocation(l, u.uid).then((d) => {
					this.lat = l.latitude;
					this.lng = l.longitude;

					db.getTwitterFollowees(u.uid).then((twitterFollowees) => {
						console.log("Followees: ", twitterFollowees);
					});
					db.getNearbyBroadcasts(u.uid).then((broadcasts) => {
						this.broadcasts = broadcasts;
						console.log(broadcasts);
						/*	console.log("Broadcasts: ", broadcasts);
							broadcasts.forEach((broad) => {
								db.getUser(broad.uid).then((fetchedUser) => {
									var broadcast = {
										message: broad.message,
										broadcastID: broad.broadcastID,
										user: fetchedUser
										//responses, subject		      	
									};
									this.broadcasts.push(broadcast);
								})
							});*/
						//this.broadcasts = broadcasts;
					});
					db.getNearbyUsers(u.uid).then((nearbyUsers) => {
						console.log("Nearby:", nearbyUsers);

						this.nearbyUsers = nearbyUsers;
						// this.filteredUsers = nearbyUsers; //copy of users for filtering ONLY

						//this.generateCommonMap();
						this.maintainFilter();
					}).catch((err) => {
						console.error(err);
					})
				}).catch((e) => {
					console.error(e);
				})
			})
		})
		// this.generateCommonMap();
		// this.auth.isAuthed().then((user) => {
		//   console.log("Authed:",user)
		//   this.model.user.uid = user.uid;
		// });  
	}

	ngOnInit() {
	}

	filterUsersBasedOnInterests(interest) {
		var filterUsersArray = [];
		var modelInterests = [];
		var userInterests = [];

		if (true) {
			var p = new Promise((resolve, reject) => {
				this.db.getInterests(this.model.user.uid).then((mi) => {
					/*if(typeof mi !== 'undefined'){*/
					if (Object.keys(mi).indexOf(interest) != -1) {

						modelInterests = Object.values(mi[interest]);
						// console.log("MI: " +modelInterests;
					}
				})
				console.log(modelInterests);
				this.filteredUsers.forEach((user) => {
					var match = false;

					this.db.getInterests(user.uid).then((ui) => {
						if (ui != null) {
							if (Object.keys(ui).indexOf(interest) != -1) {

								userInterests = Object.values(ui[interest]);
								// console.log("UI: " +userInterests);
							}
						}
						else{ //if null, empty out the list
							userInterests = [];
						}
						for (var i = 0; i < modelInterests.length; i++) {
							for (var j = 0; j < userInterests.length; j++) {
								// console.log(modelInterests[i] + " + " + userInterests[j]);
								if (modelInterests[i] == userInterests[j]) {
									match = true;
									break;
								}
							}
						}
						if (match) {
							filterUsersArray.push(user);
						}
						resolve(filterUsersArray);
					}).catch((err) => {
						console.log(err);
						reject(err);
					});
				});
			}).then((users: any) => {
				this.filteredUsers = filterUsersArray;
				console.log("Filtered Users:", filterUsersArray);
			});
		}
	}

	filterUsersBasedOnFacebook(num: number) {

		var filterUsersArray = [];
		if (true /*check facebook thing*/) {

			this.db.getFacebookFriends(this.model.user.uid).then((friends) => {
				var friendMap = new Map();

				friends.forEach((friend) => {
					friendMap.set(friend, 1);

				});
				var p = new Promise((resolve, reject) => {
					this.filteredUsers.forEach((user) => {
						//this.facebookCommon = 0;
						//this.holder = this.commonMap.get(user.uid);
						this.db.getFacebookFriends(user.uid).then((nearbyFriend) => {
							var match = false;
							this.holder = this.commonMap.get(user.uid);
							console.log(this.holder);
							nearbyFriend.forEach((friend) => {
								//console.log(friend);
								if (friendMap.get(friend)) {
									match = true;
									this.facebookCommon = this.facebookCommon + 1;
									//console.log(this.facebookCommon)
									// this.holder.facebook = true;
									// this.holder.FB = "Facebook"
									(this.commonMap.get(user.uid)).facebook = true;
									(this.commonMap.get(user.uid)).FB = "Facebook"
								}
							});
							// this.holder.facebookNum = this.facebookCommon;
							(this.commonMap.get(user.uid)).facebookNum = this.facebookCommon;
							if (match) {

								filterUsersArray.push(user);
							}
							resolve(filterUsersArray);

						}).catch((err) => {
							console.log(err);
							reject(err);
						});
						//this.holder.facebookNum = 0;
						//this.holder.facebookNum = (this.facebookCommon /2);

					});
				}).then((users: any) => {
					if (!num) {
						this.filteredUsers = filterUsersArray;
						console.log("Filtered Users Facebook:", filterUsersArray);
					}
					else {

					}
				});
			}).catch((err) => {
				console.error(err);
			});
		}
	}

	filterUsersBasedOnTwitter(num: number) {

		var filterUsersArray = [];
		if (true) {
			this.db.getTwitterFollowees(this.model.user.uid).then((followees) => {
				var followeeMap = new Map();

				followees.forEach((followee) => {
					followeeMap.set(followee, 1);
				});
				var p = new Promise((resolve, reject) => {
					this.filteredUsers.forEach((user) => {
						//this.twitterCommon = 0;
						this.db.getTwitterFollowees(user.uid).then((nearbyFollowee) => {
							var match = false;
							this.holder = this.commonMap.get(user.uid);

							nearbyFollowee.forEach((followee) => {
								if (followeeMap.get(followee)) {
									match = true;
									this.twitterCommon = this.twitterCommon + 1;
									this.holder.twitter = true;
									this.holder.TW = "Twitter"
								}
							});
							this.holder.twitterNum = this.twitterCommon;

							if (match) {
								filterUsersArray.push(user);
							}
							resolve(filterUsersArray);
						}).catch((err) => {
							console.log(err);
							reject(err);
						});
					});
				}).then((users: any) => {
					if (!num) {
						this.filteredUsers = filterUsersArray;
						console.log("Filtered Users:", filterUsersArray);
					}
					else {

					}
				});
			}).catch((err) => {
				console.error(err);
			});
		}
	}

	filterUsersBasedOnYoutube(num: number) {

		var filterUsersArray = [];
		if (true) {
			this.db.getYoutubeSubscribers(this.model.user.uid).then((subscribers) => {
				var subscriberMap = new Map();
				console.log("this is the subs", subscribers)
				Object.keys(subscribers).forEach((subscriber) => {
					subscriberMap.set(subscriber, 1);
				});
				var p = new Promise((resolve, reject) => {
					//console.log("youtube map works?", subscriberMap)
					this.filteredUsers.forEach((user) => {
						this.youtubeCommon = 0;
						this.db.getYoutubeSubscribers(user.uid).then((nearbySubscriber) => {
							var match = false;
							this.holder = this.commonMap.get(user.uid);
							Object.keys(nearbySubscriber).forEach((subscriber) => {

								//console.log(subscriber)
								//console.log(subscriberMap);
								if (subscriberMap.get(subscriber)) {
									match = true;
									//console.log("hellllllllllooooooooooo")
									this.youtubeCommon = this.youtubeCommon + 1;
									this.holder.youtube = true;
									this.holder.YT = "Youtube"
								}
							});
							this.holder.youtubeNum = this.youtubeCommon;

							if (match) {
								filterUsersArray.push(user);
							}
							resolve(filterUsersArray);
						}).catch((err) => {
							console.log(err);
							reject(err);
						});
					});
				}).then((users: any) => {
					if (!num) {
						this.filteredUsers = filterUsersArray;
						console.log("Filtered Users:", filterUsersArray);
					}
					else {

					}
				}).catch((err) => {
					console.error(err);
				});
			}).catch((err) => {
				console.error(err);
			});
		}
	}

	filterUsersBasedOnBlackboard(num: number) {
		//console.log("Blackboard");
		var filterUsersArray = [];
		this.db.getClasses(this.model.user.uid).then((classes) => {
			var classesMap = new Map();

			classes.forEach((singleClass) => {
				classesMap.set(singleClass, 1);
			});

			var p = new Promise((resolve, reject) => {
				this.filteredUsers.forEach((user) => {
					this.blackboardCommon = 0;

					this.db.getClasses(user.uid).then((nearbyUser) => {
						var match = false;
						this.holder = this.commonMap.get(user.uid);

						if (nearbyUser != null) {
							nearbyUser.forEach((singleClass) => {
								if (classesMap.get(singleClass)) {
									match = true;
									this.blackboardCommon = this.blackboardCommon + 1;
									this.holder.blackboard = true;
									this.holder.BB = "BlackBoard"
								}
							});
							this.holder.blackboardNum = this.blackboardCommon;

						}
						if (match) {
							filterUsersArray.push(user);
						}
						resolve(filterUsersArray);
					}).catch((err) => {
						console.log(err);
						reject(err);
					});
				});
			}).then((users: any) => {
				if (!num) {
					this.filteredUsers = filterUsersArray;
					console.log("Filtered Users:", filterUsersArray);
				}
				else {

				}
			}).catch((err) => {
				console.error(err);
			});
		}).catch((err) => {
			console.log(err);

		})
	}

	sendBroadcast() {
		var location = {
			latitude: this.lat,
			longitude: this.lng
		};
		this.db.storeBroadcast(this.model.user.uid, location, this.broadcastText, (new Date).getMilliseconds()).then((data) => {
			console.log("broadcast sent");
		}).catch((err) => {
			console.error(err);
		})
		console.log(this.broadcastText);
	}

	viewBroadcast(broadcastToView) {
		console.log("viewing");

		this.selectedBroadcast = broadcastToView;
		this.broadcastResponses = broadcastToView.responses;
		/*code to display proper messages*/
	}

	respondToBroadcast() {
		console.log("Here");
		if (this.selectedBroadcast) {
			this.db.respondToBroadcast(this.model.user.uid, this.selectedBroadcast.broadcastID, this.responseText, (new Date).getMilliseconds());
		}
	}

	generateCommonMap() {
		console.log("i got called");
		this.auth.getUser().then((u) => {
			this.db.getNearbyUsers(u.uid).then((nearbyUsers) => {
				//console.log("Nearby:", nearbyUsers);
				this.nearbyUsers = nearbyUsers;
				this.CommonUsersList = this.nearbyUsers;
				nearbyUsers.forEach((nearbyUser) => {

					// this.facebookCommon = 0;
					// this.twitterCommon = 0;
					// this.blackboardCommon = 0;
					// this.youtubeCommon = 0;
					this.temp = new Commonalities();
					this.temp.uid = nearbyUser.uid;
					this.temp.facebook = false;
					this.temp.facebookNum = 0;
					this.temp.twitter = false;
					this.temp.twitterNum = 0;
					this.temp.blackboard = false;
					this.temp.blackboardNum = 0;
					this.temp.youtube = false;
					this.temp.youtubeNum = 0;
					this.temp.FB = "Facebook";
					this.temp.TW = "Twitter";
					this.temp.BB = "BlackBoard";
					this.temp.YT = "Youtube";

					this.commonMap.set(nearbyUser.uid, this.temp);
					// if(this.commonMap.get(nearbyUser.uid)){
					// 	this.getCommon();
					// }
				});
				this.getCommon();

			}).catch((err) => {
				console.error(err);
			})
		})

		//this.getCommon();		
	}
	getCommon() {
		this.facebookCommon = 0;
		this.twitterCommon = 0;
		this.blackboardCommon = 0;
		this.youtubeCommon = 0;
		this.filterUsersBasedOnFacebook(1);
		this.filterUsersBasedOnTwitter(1);
		this.filterUsersBasedOnYoutube(1);
		this.filterUsersBasedOnBlackboard(1);

		console.log("common", this.commonMap);

	}
}