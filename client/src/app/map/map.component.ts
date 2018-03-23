import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ParticlesConfigService } from '../services/particles-config.service';
import { User } from '../services/user';
import { DatabaseService } from '../services/database.service';
import { LocationService } from '../services/location.service';

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

	nearbyUsers = [];
	filteredUsers =[];
	displayedUser: any={};

	refreshMap(){
		this.auth.getUser().then((u) => {
      this.db.getNearbyUsers(u.uid).then((nearbyUsers) => {
        console.log("Nearby:",nearbyUsers);
				this.nearbyUsers = nearbyUsers;
				//this.filteredUsers = nearbyUsers; //copy of users for filtering ONLY
				this.maintainFilter();

      }).catch((err) => {
        console.error(err);
      })
    })
	}

	toggleMood(){
		this.editMood = !this.editMood;
	}

	toggleRange(){
		this.editRange = !this.editRange;
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

	MoodStatus = "Mood Status";

	moodChange(){
		console.log(this.model);
		this.model.user.moodStatus = this.model.moodStatus;
		this.auth.getUser().then((user) => {
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				this.errors.mood = "Your mood status has been updated!"
			}).catch((err)=>{
				console.error(err);
				this.errors.mood = "Your mood status has NOT been updated!"

				//Form rejected for some reason
			})
		});


	}

	//ZOOM VALUE FOR MAP
	zoom: number = 15;
	currentZoom: number = 15;

	zoomMap(){
		this.zoom = this.currentZoom;
		
	}

	userVisible = false;

	viewUser(user: any={}){
		this.userVisible = true;
		this.displayedUser = user;
		this.displayedUser.distanceInMiles = Math.round((this.displayedUser.distance/5280)*100)/100;
		if(isNaN(this.displayedUser.distanceInMiles))
			this.displayedUser.distanceInMiles = 0;
	}

	closeUser(){
		this.userVisible = false;
	}

	filterVisible = false;

	viewFilter(){
		this.filterVisible = true;
	}

	filterSports= false;
  filterMusic = false
  filterFood = false
  filterFacebook = false
  filterTwitter = false
  filterLinkedIn = false
  filterBlackBoard = false

  closeFilter(){
		this.filterVisible = false;
		this.auth.getUser().then((user) => {
      this.db.updateUser(this.model.user).then((data) => {
        console.log(data);

      }).catch((err)=>{
        console.error(err);

      })

    });
  }

  toggleFilter(){
    this.filterVisible = !this.filterVisible;
    console.log("hit");
  }

  nearbyPin = ("../../assets/NearbyPin.png");
  userPin = ("../../assets/UserPin.png");

  //Invisibility Toggle 0=Invisible, 4hour, 12hour, 24hour, 100=Visible
  visibility;
  // visibility = this.model.user.visability;
  
  setVisible(number){
  	this.visibility = number;
  	this.model.user.visibility = number;


  	this.auth.getUser().then((user) => {
			//this.model.user.uid = user.uid;
			this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				//this.success.changeInfoS = "Your information has been updated!"
				//this.router.navigateByUrl('map');
			}).catch((err)=>{
				console.error(err);
				//this.errors.changeInfoE = "Your information has NOT been updated!"

				//Form rejected for some reason
			})
			//this.success.changeInfoS = "Your information has been updated!"

		});



	}

	sportsFilter(){
		this.auth.getUser().then((user) => {
      this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				
				if(this.model.user.filterSports){

				}
				else{
					this.maintainFilter();
				}

      }).catch((err)=>{
        console.error(err);

      })

    });
		
		
	}
	musicFilter(){
		this.auth.getUser().then((user) => {
					this.db.updateUser(this.model.user).then((data) => {
						console.log(data);

						if(this.model.user.filterMusic){

						}
						else{
							this.maintainFilter();
						}

					}).catch((err)=>{
						console.error(err);

					})

		});
	}
	foodFilter(){
		this.auth.getUser().then((user) => {
					this.db.updateUser(this.model.user).then((data) => {
						console.log(data);

						if(this.model.user.filterFood){

						}
						else{
							this.maintainFilter();
						}

					}).catch((err)=>{
						console.error(err);

					})

		});
	}
	facebookFilter(){
		this.auth.getUser().then((user) => {
      this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				
				if(this.model.user.filterFacebook){
					this.filterUsersBasedOnFacebook();
				}
				else{
					this.maintainFilter();
				}

      }).catch((err)=>{
        console.error(err);

      })

    });
		
	}
	twitterFilter(){
		this.auth.getUser().then((user) => {
					this.db.updateUser(this.model.user).then((data) => {
						console.log(data);

						if(this.model.user.filterTwitter){
							this.filterUsersBasedOnTwitter();
						}
						else{
							this.maintainFilter();
						}

					}).catch((err)=>{
						console.error(err);

					})

		});
	}
	linkedinFilter(){
		this.auth.getUser().then((user) => {
					this.db.updateUser(this.model.user).then((data) => {
						console.log(data);

						if(this.model.user.filterLinkedIn){

						}
						else{
							this.maintainFilter();
						}

					}).catch((err)=>{
						console.error(err);

					})

		});
	}
	blackboardFilter(){
		this.auth.getUser().then((user) => {
      this.db.updateUser(this.model.user).then((data) => {
				console.log(data);
				
				if(this.model.user.filterBlackBoard){

				}
				else{
					this.maintainFilter();
				}

      }).catch((err)=>{
        console.error(err);

      })

    });
	}

	maintainFilter(){
		this.filteredUsers = this.nearbyUsers;
		var count = 0;
		if(this.model.user.filterSports){

			count++;
		}
		if(this.model.user.filterMusic){

			count++;
		}
		if(this.model.user.filterFood){

			count++;
		}
		if(this.model.user.filterFacebook){
			this.filterUsersBasedOnFacebook();
			count++;
		}
		if(this.model.user.filterTwitter){
			this.filterUsersBasedOnTwitter();
			count++;
		}
		if(this.model.user.filterLinkedIn){

			count++;
		}
		if(this.model.user.filterBlackBoard){

			count++;
		}

		if(count == 0){
			this.filteredUsers = this.nearbyUsers;
		}
	}





  particlesConfig;
  submitted = false;


  constructor(private auth: AuthService, public pConfig: ParticlesConfigService, private router: Router, private db: DatabaseService, public loc: LocationService ) {


  	this.auth.isAuthed().then((user) => {
  		console.log("Authed:",user)
  		this.model.user.uid = user.uid;
  	});	


  	this.auth.getUser().then((user) => {

  		this.db.getUser(user.uid).then((userData) => {

  			this.model.user = userData
  			console.log(userData)
  			this.visibility = this.model.user.visibility;
  		})

  	});
    console.log("Early reeeee");



    loc.getLocation().then((l)=> {
      //  console.log("Reeeeeeeeeeeeeeee");
      auth.getUser().then((u) => {
        // console.log("Reeeeeeeeeeeeeeee2");
        db.storeLocation(l, u.uid).then((d) =>{
          // console.log("Reeeeeeeeeeeeeeee3");
          this.lat = l.latitude;
          this.lng = l.longitude;

          db.getTwitterFollowees(u.uid).then((twitterFollowees) => {
            console.log("Followees: ", twitterFollowees);
          })

          db.getNearbyUsers(u.uid).then((nearbyUsers) => {
            console.log("Nearby:",nearbyUsers);
						this.nearbyUsers = nearbyUsers;
						// this.filteredUsers = nearbyUsers; //copy of users for filtering ONLY
						this.maintainFilter();

          }).catch((err) => {
            console.error(err);
          })
        }).catch((e) =>{
          console.error(e);
        })
      })
    })


    this.auth.isAuthed().then((user) => {
      console.log("Authed:",user)
      this.model.user.uid = user.uid;

    });  

    this.auth.getUser().then((user) => {
      this.model.user.uid = user.uid;
      this.db.getUser(user.uid).then((userData) => {
        this.model.moodStatus = userData.moodStatus;

        this.model.user = userData;
        console.log(userData)
      })
    });
  }

  ngOnInit() {
  }

  filterUsersBasedOnFacebook(){
  	var filterUsersArray = [];
  	if(true /*check facebook thing*/){

  		this.db.getFacebookFriends(this.model.user.uid).then((friends) => {
  			var friendMap = new Map();

  			friends.forEach((friend) => {
  				friendMap.set(friend, 1);
  			});
  			var p = new Promise((resolve, reject) => {
  				this.filteredUsers.forEach((user) => {
  					this.db.getFacebookFriends(user.uid).then((nearbyFriend) => {
  						var match = false;
  						nearbyFriend.forEach((friend) => {
								//console.log(friend);
								if(friendMap.get(friend)){
									match = true;
								}
							});

  						if(match){

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
  		}).catch((err) => {
  			console.error(err);
  		});

  	}

  }

  filterUsersBasedOnTwitter(){
  	var filterUsersArray = [];
  	if(true){
  		this.db.getTwitterFollowees(this.model.user.uid).then((followees) => {
  			var followeeMap = new Map();

  			followees.forEach((followee) => {
  				followeeMap.set(followee, 1);
  			});
  			var p = new Promise((resolve, reject) => {
  				this.filteredUsers.forEach((user) => {
  					this.db.getTwitterFollowees(user.uid).then((nearbyFollowee) => {
  						var match = false;

  						nearbyFollowee.forEach((followee) => {
								if(followeeMap.get(followee)){
									
									match = true;
								}
							});
  						if(match){
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
  		}).catch((err) => {
  			console.error(err);
  		});

  	}

  }
}