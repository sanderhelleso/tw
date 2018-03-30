window.onload = start;
window.onresize = function(event) {
    // set width of fixed friendlist heading
	var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
	document.getElementById("friendsListHeadingCont").style.width = width + "px";
};

// GLOBALS USED WITHIN APP
var accountRef;
var uidKey;

var notificationRef;
var socialRef;

var loadSocial

var notificationStatus;
var availablityModeStatus;
var availabilityModeCheck;
function start() {

	// init firebase
	const config = {
	    apiKey: "AIzaSyA-hRi2HALi-xXdym3J9ov5NcplIgujH7I",
	    authDomain: "twproject-13f58.firebaseapp.com",
	    databaseURL: "https://twproject-13f58.firebaseio.com",
	    projectId: "twproject-13f58",
	    storageBucket: "twproject-13f58.appspot.com",
	    messagingSenderId: "744116401403"
	};
	firebase.initializeApp(config);

	// init tooltips
	$(document).ready(function(){
    	$('[data-toggle="tooltip"]').tooltip();   
	});

	// allows dropdown to not dismiss on click
	$('#friendRequestsMenu').bind('click', function (e) { e.stopPropagation() });
	$('#notificationMenu').bind('click', function (e) { e.stopPropagation() });
	$('#profileModalSettingsMenu').bind('click', function (e) { e.stopPropagation() });

	// set width of fixed friendlist heading
	var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
	document.getElementById("friendsListHeadingCont").style.width = width + "px";

	// load user
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
		    uidKey = user.uid;
		    accountRef = firebase.database().ref("accounts/" + uidKey);
		    accountRef.once("value", function(snapshot) {

		    	/////// RUN PROFILE FOR TESTING ///////
		    	profile();
		    	/////////////////////////////////////

		    	// set account UI and avatar image
		    	if (snapshot.val().Avatar_url != undefined) {
		    		document.getElementById("userAccount").innerHTML = "<img id='userAvatar' src=" + snapshot.val().Avatar_url + " alt='Avatar'> " + snapshot.val().First_Name + " " + snapshot.val().Last_Name + " <i data-feather='chevron-down'></i>";
		    		document.getElementById("profileImg").src = snapshot.val().Avatar_url;
		    	}

		    	else {
		    		document.getElementById("userAccount").innerHTML = "<img id='userAvatar' src='/img/avatar.png' alt='Avatar'> " + snapshot.val().First_Name + " " + snapshot.val().Last_Name + " <i data-feather='chevron-down'></i>";
		    		document.getElementById("profileImg").src = "/img/avatar.png";
		    	}
		    	
		    	// load icon module
		    	feather.replace();

		    	// load notification status
		    	notificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications");
		    	notificationRef.once("value", function(snapshot) {
		    		// set value if first sign in
		    		if (snapshot.val() === null) {
		    			notificationRef.update({
		    				Notification_Status: "on"
		    			});
		    		}
		    		else {
		    			notificationStatus = snapshot.val().Notification_Status;
		    			toggleNotifications();
		    		}
		    	});

		    	// load social data
		    	socialRef = firebase.database().ref("accounts/" + uidKey + "/social");
		    	socialRef.once("value", function(snapshot) {
		    		// set value if first sign in
		    		if (snapshot.val() === null ) {
		    			socialRef.update({
		    				Mode: "publicmode"
		    			});
		    		}
		    		else {
		    			availabilityModeStatus = snapshot.val().Mode;
		    			availabilityMode();
		    		}
		    	});

		    	// load friend requests
		    	loadFriendRequests();

		    	// load notifications
				loadNotifications();

				// load friends
				loadFriends();

				// load overview on profile load
				document.getElementById("overviewTrigger").click();
				
				// file upload on avatar click
				$('#profileImg').click(function(){ $('#avatarUpload').trigger('click'); });

				// upload avatar
				document.getElementById("avatarUpload").addEventListener("change", uploadAvatar);
				
		    	// fade in dashboard
		    	document.getElementById("loadingCover").classList.add("fadeOut");
	    		setTimeout(function() {
	    			document.getElementById("loadingCover").classList.remove("fadeOut");
		    		document.getElementById("loadingCover").style.display = "none";
		    		document.getElementById("body").classList.add("fadeIn");
		    	},  100);
		    });
		}
	});

	// sign out listener
	document.getElementById("signOut").addEventListener("click", signOut);

	// user menu
	document.getElementById("userAccount").addEventListener("click", openMenu);

	// notifications
	document.getElementById("notificationsOff").addEventListener("click", toggleNotifications);

	// trigger social events
	document.getElementById("socialTrigger").addEventListener("click", social);

	// trigger profile events
	document.getElementById("profileTrigger").addEventListener("click", profile);
}

/************************** FUNCTIONS USED WITHIN APP *******************************/

// function to capitalize first letters, used within app
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// styles for user dropdown menu
function openMenu() {
	document.getElementById("userAccountMenu").classList.add("fadeIn");
	setTimeout(function() {
		document.getElementById("userAccountMenu").classList.remove("fadeIn");
	}, 600);
}

// clear and refresh dashboard on change
function clear() {
	var childs = document.getElementById("dashboardContainer").childNodes;
	for (var i = 0; i < childs.length; i++) {
		if (childs[i].tagName === "DIV") {
			childs[i].style.display = "none";
		}
	}
}

/************************* END FUNCTIONS USED WITHIN APP ****************************/



/********************************** SOCIAL *****************************************/
function social() {
	clear();

	// display containers
	document.getElementById("socialMain").style.display = "block";
	document.getElementById("socialAside").style.display = "block";

    // set width of fixed friendlist heading
	var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
	document.getElementById("friendsListHeadingCont").style.width = width + "px";


	// availablity mode
	document.getElementById("toggleMode").addEventListener("click", availabilityMode);

	// fixed search bar for friend list
	document.getElementById("socialAside").addEventListener("scroll", positionSearchbar);

	// toggle search friends
	document.getElementById("toggleSearch").addEventListener("click", showSearchbarFriends);

	// filter friends
	document.getElementById("filterFriends").addEventListener("keyup", filterFriends);

	// add friend event
	document.getElementById("addFriend").addEventListener("click", addFriend);

	// set amount of online friends
	var online = document.getElementsByClassName("online").length;
	document.getElementById("amountOnline").innerHTML = online + " online";
}

// load friend requests, run at start
function loadFriendRequests() {
	// count to controll flow of divider
	var count = 0;

	// request ref
	var friendRequestRef = firebase.database().ref("accounts/" + uidKey + "/friend_requests");
	friendRequestRef.once("value", function(snapshot) {
		// create requests for each value
		snapshot.forEach((child) => {
			count++;

			// only create divider if there are more than one request
			if (count > 1) {
				// create divider
				var divider = document.createElement("div");
				divider.classList.add("dropdown-divider") + divider.classList.add("friendRequestDivider");
				document.getElementById("friendRequestsMenu").appendChild(divider);
			}

			// create container
			var cont = document.createElement("div");
			cont.id = "friendRequest-" + child.key;
			cont.classList.add("pendingFriendRequest") + cont.classList.add("animated") + cont.classList.add("fadeIn");

			// create avatar and heading
			var headingCont = document.createElement("div");
			var avatar = document.createElement("img");
			avatar.classList.add("pendingFriendRequestAvatar");
			avatar.src = "img/avatar.png";
			var headingSpan = document.createElement("span");
			headingSpan.classList.add("pendingFriendRequestName");
			headingSpan.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

			// set heading
			headingCont.appendChild(avatar);
			headingCont.appendChild(headingSpan);
			cont.appendChild(headingCont);

			// create email and breakline
			var email = document.createElement("span");
			email.classList.add("pendingFriendRequestEmail");
			email.innerHTML = child.val().Email;
			var br = document.createElement("br");

			// set email and breakline
			cont.appendChild(email);
			cont.appendChild(br);

			// create choices - accept / decline
			var choices = document.createElement("span");
			choices.innerHTML = document.getElementById("masterRequest").childNodes[1].outerHTML;

			// init add friend event listenr
			choices.childNodes[0].childNodes[0].addEventListener("click", acceptFriendRequest);

			// init decline friend event listener
			choices.childNodes[0].childNodes[2].addEventListener("click", declineFriendRequest);

			// append choices to container
			cont.appendChild(choices);

			// append request to menu and display
			document.getElementById("friendRequestsMenu").appendChild(cont);

  		});

		// check amount and edit spelling depening on amount
  		if (count === 1) {
  			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + count + " pending friend request";
  		}
  		else {
  			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + count + " pending friend requests";
  		}
	});
}


// count to controll amount message
var notificationCount = 0;
// load notifications, run at start
function loadNotifications() {
	// ref for friend request notifications
	var notificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications/friend_request_notifications/");
	notificationRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			notificationCount++;
			console.log(child.val());
			console.log(child.key);

			// only create divider if there are more than one request
			if (notificationCount > 1) {
				// create divider
				var divider = document.createElement("div");
				divider.classList.add("dropdown-divider") + divider.classList.add("notificationDivider");
				document.getElementById("notificationMenu").appendChild(divider);
			}

			// create notifications
			var notificationLink = document.createElement("a");
			notificationLink.classList.add("dropdown-item") + notificationLink.classList.add("notificationLink") + notificationLink.classList.add("animated") + notificationLink.classList.add("fadeIn");
			notificationLink.id = "friendRequestNotification-" + child.key;
			notificationLink.href = "#friendRequest-" + child.key;

			// add event listner to open friend request
			notificationLink.addEventListener("click", openNotification);

			// create and set timestamp
			var time = document.createElement("span");
			time.classList.add("friendRequestNotificationTime");
			time.innerHTML = child.val().timestamp;

			// create remove button
			var remove = document.createElement("span");
			remove.classList.add("removeNotification");
			remove.innerHTML = document.getElementById("removeNotification").childNodes[0].outerHTML;
			remove.addEventListener("click", removeNotification);

			// create breakline
			var br = document.createElement("br");

			// create and set notification message
			var notificationMessage = document.createElement("span");
			notificationMessage.innerHTML = child.val().message;
			notificationMessage.classList.add("notificationMessage");

			// append in correct order
			notificationLink.appendChild(time);
			notificationLink.appendChild(remove);
			notificationLink.appendChild(br);
			notificationLink.appendChild(notificationMessage);

			// display notifications
			document.getElementById("notificationMenu").appendChild(notificationLink);
  		});

  		// remove notification placeholder
  		if (notificationCount >= 1) {
			document.getElementById("notificationPlaceholder").style.display = "none";
		}
	});
}

function loadFriends() {
	// get friends
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {

			// create elements
			var cont = document.createElement("a");
			cont.href = "#";
			cont.classList.add("list-group-item") + cont.classList.add("list-group-item-action") + cont.classList.add("flex-column") + cont.classList.add("align-items-start") + cont.classList.add("friendsList");
			var nameCont = document.createElement("div");
			nameCont.classList.add("d-flex") + nameCont.classList.add("w-100") + nameCont.classList.add("justify-content-between");
			var name = document.createElement("h5");
			name.classList.add("mb-1") + name.classList.add("friendName");
			name.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();
			var onlineIcon = document.createElement("small");
			onlineIcon.classList.add("online");
			onlineIcon.innerHTML = document.getElementById("masterOnlineIcon").innerHTML;

			nameCont.appendChild(name);
			nameCont.appendChild(onlineIcon);

			var email = document.createElement("p");
			email.classList.add("mb-1") + email.classList.add("friendEmail");
			email.innerHTML = child.val().Email;
			var options = document.createElement("small");
			options.classList.add("friendOptions");
			options.innerHTML = document.getElementById("masterFriendOption").innerHTML;

			cont.appendChild(nameCont);
			cont.appendChild(email);
			cont.appendChild(options);
			document.getElementById("friendsListCont").appendChild(cont);
		});
	});
}

// open friend request menu on notification click
function openNotification() {

}

function removeNotification() {
	// remove selected notification
	var notification = this.parentElement;
	notification.remove();
	notificationCount--;
	if (document.getElementsByClassName("notificationDivider")[0] != undefined) {
		document.getElementsByClassName("notificationDivider")[0].remove();
	}

	// display default message if no notifications are present
	if (notificationCount === 0) {
		document.getElementById("notificationPlaceholder").innerHTML = "No new notifications, you are good to go!";
		document.getElementById("notificationPlaceholder").style.display = "block";
	}

	// delete notification
	var deleteNotificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications/friend_request_notifications/" + this.parentElement.id.split("-")[1]);
	deleteNotificationRef.remove();

}

// toggle on / off notifications
function toggleNotifications() {

	// notification toggle button
	var notificationsOff = document.getElementById("notificationsOff");

	// set static bg color to override bootstrap dropdown-item active effect
	notificationsOff.style.backgroundColor = "white";

	// notifications
	var notifications = document.getElementsByClassName("notificationLink");
	var divider = document.getElementsByClassName("notificationDivider");

	// if notification is on
	var path = notificationsOff.childNodes[0].childNodes[0].outerHTML;
	var line = notificationsOff.childNodes[0].childNodes[1];
	var notification = document.getElementById("notification");
	if (notification.classList.contains("feather-bell")) {
		if (notificationStatus === "off" || notificationStatus === true) {
			notificationsOff.classList.remove("feather-bell-off");
			notificationsOff.classList.add("feather-bell");
			notificationsOff.childNodes[0].childNodes[0].outerHTML = notification.childNodes[0].outerHTML;
			notificationsOff.childNodes[2].innerHTML = "Turn on notifications";

			notification.classList.remove("feather-bell");
			notification.classList.add("feather-bell-off");
			notification.childNodes[0].outerHTML = path;
			notification.appendChild(line);
			feather.replace();

			// hide notifications
			for (var i = 0; i < notifications.length; i++) {
				notifications[i].style.display = "none";
			}

			for (var i = 0; i < divider.length; i++) {
				divider[i].style.display = "none";
			}

			notificationRef.update({
				Notification_Status: "off"
			});
		}
	}

	// if notification is off
	else {
		if (notificationStatus === "on" || notificationStatus === true) {
			notificationsOff.classList.remove("feather-bell");
			notificationsOff.classList.add("feather-bell-off");
			notificationsOff.childNodes[0].childNodes[0].outerHTML = notification.childNodes[0].outerHTML;
			var line = notification.childNodes[1];
			notificationsOff.childNodes[0].appendChild(line);
			notificationsOff.childNodes[2].innerHTML = "Turn off notifications";
			notification.classList.remove("feather-bell-off");
			notification.classList.add("feather-bell");
			notification.childNodes[0].outerHTML = path;
			feather.replace();

			// show notifications
			for (var i = 0; i < notifications.length; i++) {
				notifications[i].style.display = "block";
			}

			for (var i = 0; i < divider.length; i++) {
				divider[i].style.display = "block";
			}
	
			notificationRef.update({
				Notification_Status: "on"
			});
		}
	}
	// controll check on load
	notificationStatus = true;
}

// toggle availability mode / online status
function availabilityMode() {

	// check if funcion is loaded or clicked on event
	if (loadSocial === true) {
		socialRef.once("value", function(snapshot) {
			availabilityModeStatus = snapshot.val().Mode;
		});
	}

	// mode toggle button
	var public = document.getElementById("onlineStatusIcon");
	var ghost = document.getElementById("onlineStatusIcon2");
	var toogleBtnCont = public.parentElement;

	// set mode to ghost if public and event is clicked
	if (availabilityModeStatus === "publicmode") {
		public.style.display = "block";
		ghost.style.display = "none";
		toogleBtnCont.removeAttribute("data-original-title");
		toogleBtnCont.setAttribute("data-original-title", "Publicmode");

		if (loadSocial === true) {
			public.style.display = "none";
			toogleBtnCont.removeAttribute("data-original-title");
			toogleBtnCont.setAttribute("data-original-title", "Ghostmode");
			ghost.style.display = "block";
			socialRef.set({
				Mode: "ghostmode"
			});
		}
	}

	// set mode to public if ghost and event is clicked
	else {
		if (availabilityModeStatus === "ghostmode") {
			ghost.style.display = "block";
			public.style.display = "none";
			toogleBtnCont.removeAttribute("data-original-title");
			toogleBtnCont.setAttribute("data-original-title", "Ghostmode");

			if (loadSocial === true) {
				ghost.style.display = "none";
				public.style.display = "block";
				toogleBtnCont.removeAttribute("data-original-title");
				toogleBtnCont.setAttribute("data-original-title", "Publicmode");
				socialRef.set({
					Mode: "publicmode"
				});
			}
		}
	}
	loadSocial = true;
	availabilityModeCheck = false;
}

// not in use for the moment
function positionSearchbar() {}

// hide / show searchbar for friendslist
function showSearchbarFriends() {
	var searchbar = document.getElementById("filterFriends");
	this.style.pointerEvents = "none";
	setTimeout(function() {
		document.getElementById("toggleSearch").style.pointerEvents = "auto";
	},  1000);

	if (searchbar.style.display === "block") {
		document.getElementById("friendsListCont").style.paddingTop = "80px";
		searchbar.classList.remove("slideOutUp");
		searchbar.classList.add("slideOutUp");
		setTimeout(function() {
			searchbar.classList.remove("slideOutUp");
			searchbar.style.display = "none";
		},  1000);
	}

	else {
		document.getElementById("friendsListCont").style.paddingTop = "120px";
		searchbar.classList.add("slideInDown");
		searchbar.style.display = "block";
		setTimeout(function() {
			searchbar.classList.remove("slideInDown");
		},  1000);
	}
}

// filter out friends
function filterFriends() {
	var filter = this.value.toLowerCase();
	var names = document.getElementsByClassName("friendName");
	for (var i = 0; i < names.length; i++) {
		names[i].parentElement.parentElement.classList.add("animated") + names[i].parentElement.parentElement.classList.add("fadeIn");
		if (names[i].innerHTML.toLowerCase().indexOf(filter) > -1) {
			names[i].parentElement.parentElement.style.display = "block";
		}

		else {
			names[i].parentElement.parentElement.style.display = "none";
		}
	}
}

// add friend
function addFriend() {

	// hide default container
	document.getElementById("socialiconCont").style.display = "none";

	// show add friend container
	document.getElementById("addFriendCont").style.display = "block";

	// intitialize search
	document.getElementById("searchNewFriend").addEventListener("click", findFriend);
}

// search through accounts and find matching result
function findFriend() {
	var search = document.getElementById("addFriendSearch");
	if (search.value === "" || search.value === " ") {
		document.getElementById("searchNewFriendError").classList.add("bounceIn");
		document.getElementById("searchNewFriendError").innerHTML = "Search cant be empty! Please enter a valid email address or full name."
		document.getElementById("searchNewFriendError").style.display = "block";
		setTimeout(function() {
			document.getElementById("searchNewFriendError").classList.remove("bounceIn");
		}, 1000);
		return;
	}

	// variables used to check if no matches were found before displaying error message
	var keys = [];
	var arr = [];
	var notFoundCount = 0;
	var foundCount = 0;
	allAccountsRef = firebase.database().ref("accounts/");
	allAccountsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			arr.push(child.val());
			keys.push(child.key);
  		});
  		console.log(arr);

  		// reset before displaying results
		document.getElementById("searchResults").innerHTML = "";

		// loop through accounts
  		for (var i = 0; i < arr.length; i++) {
  			// exclude signed in user from search
			if (keys[i] != uidKey) {
				// check for matches
				if (search.value.toLowerCase() === arr[i].Email || arr[i].First_Name.toLowerCase() + " " + arr[i].Last_Name.toLowerCase() === search.value.toLowerCase()) {
					foundCount++;

					// show success message
					document.getElementById("searchNewFriendError").style.display = "none";
					document.getElementById("searchNewFriendSuccess").style.display = "block";
					document.getElementById("searchNewFriendSuccess").innerHTML = "We succesfully found <strong>" + foundCount + "</strong> accounts connected to your search!"; 

					// add scrollbar to container if needed
					document.getElementById("socialMain").style.overflowY = "scroll";

					// create elements
					var cont = document.createElement("div");
					cont.id = keys[i];
					cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("text-center") + cont.classList.add("animated");
					var name = document.createElement("h5");
					name.innerHTML = arr[i].First_Name.toUpperCase() + " " + arr[i].Last_Name.toUpperCase();
					var email = document.createElement("p");
					email.innerHTML = arr[i].Email.toLowerCase();
					var avatar = document.createElement("img");
					avatar.classList.add("searchResultsAvatar");
					avatar.src = "img/avatar.png";
					var bio = document.createElement("p");
					bio.classList.add("bio");
					var icons = document.createElement("span");
					icons.classList.add("searchResultsIcons");
					icons.innerHTML = document.getElementById("masterResult").childNodes[1].innerHTML;
					console.log(document.getElementById("masterResult").childNodes[1]);

					// append
					cont.appendChild(name);
					cont.appendChild(email);
					cont.appendChild(avatar);

					// check if user got a bio set
					if (arr[i].Bio != undefined) {
						bio.innerHTML = arr[i].Bio;
						cont.appendChild(bio);
					}

					// if not set default text
					else {
						bio.innerHTML = "This user has not set a bio";
						cont.appendChild(bio);
					}

					cont.appendChild(icons);

					// display results
					cont.classList.add("fadeInUp");
					document.getElementById("searchResults").appendChild(cont);
					$('#socialMain').animate({
					    scrollTop: $("#searchResults").offset().top,
					}, 1500);
				}

				// if no matches were found, display error message
				else {
					notFoundCount++;
					if (notFoundCount === arr.length - 1) {
						// show error message
						document.getElementById("searchNewFriendSuccess").style.display = "none";
						document.getElementById("searchNewFriendError").classList.add("bounceIn");
						document.getElementById("searchNewFriendError").innerHTML = "We could not find any registered account connected to <strong>" + search.value.toUpperCase() + "</strong>.";
						document.getElementById("searchNewFriendError").style.display = "block";
						setTimeout(function() {
							document.getElementById("searchNewFriendError").classList.remove("bounceIn");
						}, 1000);
						return;
					}
				}
			}
  		}
  		// init friend request trigger
		var sendFriendRequestTrigger = document.getElementsByClassName("sendFriendRequest");
		for (var i = 0; i < sendFriendRequestTrigger.length; i++) {
			sendFriendRequestTrigger[i].addEventListener("click", sendFriendRequest);
		}

		// init send friend message trigger
		/******* COMMING SOON ***********/

	});
}

function sendFriendRequest() {
	// show snackbar to confirm friend request has been sendt / if a request allready is pening
	var snackbar = document.getElementById("snackbar")
	var name = this.parentElement.parentElement.childNodes[0].innerHTML;
	var id = this.parentElement.parentElement.id;

	// check if user is allready friend
	var friendRef = firebase.database().ref("accounts/" + id + "/friends/" + uidKey);
	friendRef.once("value", function(snapshot) {
		// check if ref is present
		if (snapshot.val() != null) {
			snackbar.innerHTML = "You are allready friend with " + name.split(" ")[0];
    		snackbar.className = "show";
    		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
    		return;
		}

		// get user ref for request to be sendt, and who request were sendt from
		var friendRequestRef = firebase.database().ref("accounts/" + id + "/friend_requests/" + uidKey);
		friendRequestRef.once("value", function(snapshot) {
			// if a request is allready sendt
			if (snapshot.val() != null) {
				snackbar.innerHTML = "You allready sendt a friend request to " + name.split(" ")[0];
	    		snackbar.className = "show";
	    		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
	    		return;
			}

			else {

				// variables to hold detail
				var firstName;
				var lastName;
				var email;

				// get timestamp
				var now = new Date(); 
			    var month = now.getMonth()+1; 
			    var day = now.getDate();
			    var hour = now.getHours();
			    var minute = now.getMinutes();

			    // add zeros if needed
			    if (month.toString().length == 1) {
			        var month = '0' + month;
			    }
			    if (day.toString().length == 1) {
			        var day = '0' + day;
			    }   
			    if (hour.toString().length == 1) {
			        var hour = '0' + hour;
			    }
			    if (minute.toString().length == 1) {
			        var minute = '0' + minute;
			    }

			    var dateTime = day + '.' + month + ' ' + hour + ':' + minute;  

				// get info to fill request, send
				accountRef = firebase.database().ref("accounts/" + uidKey);
				accountRef.once("value", function(snapshot) {
					firstName = snapshot.val().First_Name;
					lastName = snapshot.val().Last_Name;
					email = snapshot.val().Email;
					friendRequestRef.update({
						First_Name: firstName,
						Last_Name: lastName,
						Email: email
					});

					// send request and store it
					var notificationRef = firebase.database().ref("accounts/" + id + "/notifications/friend_request_notifications/" + uidKey);
					notificationRef.update({
						timestamp: dateTime,
						message: firstName.capitalizeFirstLetter() + " " + lastName.capitalizeFirstLetter() + " has sendt you a friend request!" 
					});
				});

				// display message
				snackbar.innerHTML = "A friend request has been sendt to " + name.split(" ")[0];
			    snackbar.className = "show";
			    setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
			}
		});
	});
}

// accept friend request
function acceptFriendRequest() {
	// get user key
	var userKey = this.parentElement.parentElement.parentElement.id.split("-")[1];
	var friendRef = firebase.database().ref("accounts/" + uidKey + "/friends/" + userKey);
	var acceptedFriendRef = firebase.database().ref("accounts/" + userKey + "/friends/" + uidKey);
	var friendCont = this.parentElement.parentElement.parentElement;
	
	// get friend data
	accountRef = firebase.database().ref("accounts/" + userKey);
	accountRef.once("value", function(snapshot) {
		var firstName = snapshot.val().First_Name;
		var lastName = snapshot.val().Last_Name;
		var email = snapshot.val().Email;

		// friend added
		friendRef.update({
			First_Name: firstName,
			Last_Name: lastName,
			Email: email
		});

		// create friend element and display it in friends list
		var cont = document.createElement("a");
		cont.href = "#";
		cont.classList.add("list-group-item") + cont.classList.add("list-group-item-action") + cont.classList.add("flex-column") + cont.classList.add("align-items-start") + cont.classList.add("friendsList") + cont.classList.add("animated") + cont.classList.add("fadeIn");
		var nameCont = document.createElement("div");
		nameCont.classList.add("d-flex") + nameCont.classList.add("w-100") + nameCont.classList.add("justify-content-between");
		var name = document.createElement("h5");
		name.classList.add("mb-1") + name.classList.add("friendName");
		name.innerHTML = firstName.capitalizeFirstLetter() + " " + lastName.capitalizeFirstLetter();
		var onlineIcon = document.createElement("small");
		onlineIcon.classList.add("online");
		onlineIcon.innerHTML = document.getElementById("masterOnlineIcon").innerHTML;

		nameCont.appendChild(name);
		nameCont.appendChild(onlineIcon);

		var friendEmail = document.createElement("p");
		friendEmail.classList.add("mb-1") + friendEmail.classList.add("friendEmail");
		friendEmail.innerHTML = email;
		var options = document.createElement("small");
		options.classList.add("friendOptions");
		options.innerHTML = document.getElementById("masterFriendOption").innerHTML;

		cont.appendChild(nameCont);
		cont.appendChild(friendEmail);
		cont.appendChild(options);
		document.getElementById("friendsListCont").appendChild(cont);

		// set friend to user who requested to be friend
		var accountRef = firebase.database().ref("accounts/" + uidKey);
		accountRef.once("value", function(snapshot) {
			var firstName = snapshot.val().First_Name;
			var lastName = snapshot.val().Last_Name;
			var email = snapshot.val().Email;

			// friend added
			acceptedFriendRef.update({
				First_Name: firstName,
				Last_Name: lastName,
				Email: email
			});

			// remove friend request
			var friendRequestRef = firebase.database().ref("accounts/" + uidKey + "/friend_requests/" + userKey);
			friendRequestRef.remove();
		});

		// remove request from DOM
		friendCont.style.display = "none";

		// get current amount and update message
		var amountOfRequests = parseInt(document.getElementById("friendRequestPlaceholder").innerHTML.split(" ")[2]);
		if (amountOfRequests - 1 === 1) {
			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend request";
		}

		else {
			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend requests";
		}
	});
}

// decline friend request
function declineFriendRequest() {
	console.log(123);
}

// sign out
function signOut() {
	document.getElementById("loadingCover").classList.add("fadeOut")
	document.getElementById("loadingCover").style.display = "block";
	document.getElementById("loadingSlogan").innerHTML = "Signing Out";
	firebase.auth().signOut().then(function() {
		document.getElementById("loadingSlogan").innerHTML = "Signed out succesfully";
		setTimeout(function() {
			window.location.replace("/");
		},  1000);
	}, function(error) {
		document.getElementById("loadingSlogan").innerHTML = error.message;
		setTimeout(function() {
			document.getElementById("loadingCover").classList.add("fadeOut");
		    document.getElementById("loadingCover").style.display = "none";
		    document.getElementById("body").classList.add("fadeIn");
		},  2000);
	});
}

/********************************* END SOCIAL ************************************/





/************************************ PROFILE *************************************/
function profile() {
	//clear();
	loadProfileFriends();
	document.getElementById("overviewTrigger").click();

	// load profile data
	accountRef.once("value", function(snapshot) {
		if (snapshot.val().Bio != undefined) {
			document.getElementById("bioTextarea").value = snapshot.val().Bio;
		}
		
		document.getElementById("firstNameProfile").value = snapshot.val().First_Name;
		document.getElementById("lastNameProfile").value = snapshot.val().Last_Name;
		document.getElementById("emailProfile").value = snapshot.val().Email;
	});

}

// load account friends
function loadProfileFriends() {
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			
			// create friend container
			var cont = document.createElement("div");
			cont.id = "profile-" + child.key;
			cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn");

			// create avatar img
			var friendImg = document.createElement("img");
			friendImg.classList.add("friendsAvatar");

			// set img src to be avatar url
			friendRef = firebase.database().ref("accounts/" + child.key);
			friendRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					friendImg.src = snapshot.val().Avatar_url;
				}

				else {
					friendImg.src = "/img/avatar.png";
				}
			});

			// create friend name
			var friendName = document.createElement("h5");
			friendName.classList.add("friendsName");
			friendName.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

			// create friend email
			var friendEmail = document.createElement("p");
			friendEmail.classList.add("friendsEmail");
			friendEmail.innerHTML = child.val().Email;

			// append
			cont.appendChild(friendImg);
			cont.appendChild(friendName);
			cont.appendChild(friendEmail);

			// add event listener to container, used to open the selected profile
			cont.addEventListener("click", openProfile);

			// display
			document.getElementById("profileFriendsRow").appendChild(cont);


  		});
	});
}

var settingsKey;
function openProfile() {
	// get profile key
	var profileKey = this.id.split("-")[1];

	// used to controll settings
	settingsKey = profileKey;

	// reset friends cont before appending
	document.getElementById("profileModalFriendsRow").innerHTML = "";

	// unblur image when cancelling a setting
	document.getElementById("body").addEventListener("click", unblur);

	// profile modal elements
	var profileAvatar = document.getElementById("profileModalAvatar");
	var profileName = document.getElementById("profileModalName");
	var profileEmail = document.getElementById("profileModalEmail");
	var profileBio = document.getElementById("profileModalBio");

	// set data from profile ref
	var profileRef = firebase.database().ref("accounts/" + profileKey);
	profileRef.once("value", function(snapshot) {

		// set settings
		document.getElementById("profileModalSettingsHeading").innerHTML = "Settings for " + snapshot.val().First_Name.capitalizeFirstLetter();

		// init settings event
		document.getElementById("unfriendUser").addEventListener("click", unfriendUser);
		document.getElementById("reportUser").addEventListener("click", reportUser);
		document.getElementById("blockUser").addEventListener("click", blockUser);

		// set information
		profileAvatar.src = snapshot.val().Avatar_url;
		profileName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		profileEmail.innerHTML = snapshot.val().Email;

		// check for user bio
		if (snapshot.val().Bio != undefined) {
			profileBio.innerHTML = snapshot.val().Bio;
			profileBio.style.display = "block";
		}

		else {
			profileBio.innerHTML = "";
			profileBio.style.display = "none";
		}

		// connect with profile
		document.getElementById("connectUser").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter();

		// check for common friends
		var commonFriends = [];
		var friends = [];
		var profileFriends = [];
		var myFriendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
		var profileFriendsRef = firebase.database().ref("accounts/" + profileKey + "/friends");
		myFriendsRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				friends.push(child.key);
			});
		});


		profileFriendsRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				profileFriends.push(child.key);

				// create friend container
				var cont = document.createElement("div");
				cont.id = "profile-" + child.key;
				cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileModalFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn");

				// create avatar img
				var friendImg = document.createElement("img");
				friendImg.classList.add("friendsAvatar");

				// set img src to be avatar url
				friendRef = firebase.database().ref("accounts/" + child.key);
				friendRef.once("value", function(snapshot) {
					if (snapshot.val().Avatar_url != undefined) {
						friendImg.src = snapshot.val().Avatar_url;
					}

					else {
						friendImg.src = "/img/avatar.png";
					}
				});

				// create friend name
				var friendName = document.createElement("h5");
				friendName.classList.add("friendsName");
				friendName.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

				// create friend email
				var friendEmail = document.createElement("p");
				friendEmail.classList.add("friendsEmail");
				friendEmail.innerHTML = child.val().Email;

				// append
				cont.appendChild(friendImg);
				cont.appendChild(friendName);
				cont.appendChild(friendEmail);

				// add event listener to container, used to open the selected profile
				cont.addEventListener("click", openProfile);

				// check if profile is logged in account
				if (profileKey === uidKey) {
					document.getElementById("profileModalCommunication").style.display = "none";
					document.getElementById("commonFriends").innerHTML = "";
					document.getElementById("profileModalSettings").style.display = "none";
				}

				else {
					document.getElementById("profileModalCommunication").style.display = "block";
					// count amount of common friends
					var commonsCount = 0;
					for (var i = 0; i < friends.length; i++) {
						for (var x = 0; x < profileFriends.length; x++) {
							if (friends[i] === profileFriends[x]) {
								commonsCount++;
							}
						}
					}
					document.getElementById("commonFriends").innerHTML = commonsCount + " common";
					document.getElementById("profileModalSettings").style.display = "inline-block";
				}

				// display
				document.getElementById("profileModalFriendsRow").appendChild(cont);
			});

			// show profile
			$('#profileModal').modal('show');
		});
	});
}


// allows user to update avatar
function uploadAvatar() {
	
	// mini and main avatar nodes
	var miniAvatar = document.getElementById("userAvatar");
	var avatar = document.getElementById("profileImg");

	// file uploaded
	var file = document.getElementById("avatarUpload").files[0];

	// upload file to db and set URL to profile
	var storageRef = firebase.storage().ref();
	var avatarRef = storageRef.child("avatars/" + uidKey);
	avatarRef.put(file).then(function(snapshot) {
	  var url = snapshot.metadata.downloadURLs[0];
	  avatar.src = url;
	  miniAvatar.src = url;
	  accountRef.update({
	  	Avatar_url: url
	  });
	});
}

// unblur avatar and reset settings options
function unblur() {
	document.getElementById("profileModalAvatar").style.filter = "none";
	cancelUnfriend();
	cancelReport();
}

// unfriend selected user
function unfriendUser() {

	// close potensial other options
	document.getElementById("cancelReport").click();

	// display unfriend form
	document.getElementById("confirmUnfriendCont").style.display = "block";
	document.getElementById("unfriendLabel").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// create label
	document.getElementById("unfriendLabel").innerHTML = "Are you sure you want to unfriend " + document.getElementById("profileModalName").innerHTML.split(" ")[0] + "?";

	// init cancel and confirm events
	document.getElementById("cancelUnfriend").addEventListener("click", cancelUnfriend);
	document.getElementById("confirmUnfriend").addEventListener("click", confirmUnfriend);
		
}

function cancelUnfriend() {
	// hide report form and remove blur from avatar image
	document.getElementById("confirmUnfriendCont").style.display = "none";
	document.getElementById("profileModalAvatar").style.filter = "none";
	document.getElementById("unfriendLabel").style.display = "none";
}

// report selected user
function reportUser() {

	//close potensial other options
	document.getElementById("cancelUnfriend").click();

	// display report form
	document.getElementById("reportReasonCont").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// init cancel and confirm events
	document.getElementById("cancelReport").addEventListener("click", cancelReport);
	document.getElementById("confirmReport").addEventListener("click", confirmReport);
}

function cancelReport() {
	// hide report form and remove blur from avatar image
	document.getElementById("reportReasonCont").style.display = "none";
	document.getElementById("profileModalAvatar").style.filter = "none";
}

function confirmReport() {
	// get reason for report
	var reason = document.getElementById("reportReason").value;

	// check if reason is selected
	if (reason === "" || reason === undefined) {
		document.getElementById("reportReason").style.borderBottom = "0.5px solid #ef5350";
		return;
	}

	else {
		document.getElementById("reportReason").style.borderBottom = "none";
	}

	// get timestamp
	var now = new Date(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + hour + ':' + minute;

	// store report with the reporter, and reason
	var reportRef = firebase.database().ref("accounts/" + settingsKey + "/reports/" + uidKey);
	reportRef.update({
		Reason: reason,
		Timestamp: dateTime
	});

	// close report
	document.getElementById("cancelReport").click();

	// display message
	snackbar.innerHTML = "Thank you for reporting this user!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// block selected user
function blockUser() {

}




/********************************* END PROFILE ***********************************/
