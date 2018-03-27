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
	    storageBucket: "",
	    messagingSenderId: "744116401403"
	};
	firebase.initializeApp(config);
	$(document).ready(function(){
    	$('[data-toggle="tooltip"]').tooltip();   
	});

	// set width of fixed friendlist heading
	var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
	document.getElementById("friendsListHeadingCont").style.width = width + "px";

	// load user
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
		    uidKey = user.uid;
		    accountRef = firebase.database().ref("accounts/" + uidKey);
		    accountRef.once("value", function(snapshot) {
		    	// set account UI
		    	document.getElementById("userAccount").innerHTML = "<img id='userAvatar' src='/img/avatar.png' alt='Avatar'> " + snapshot.val().First_Name + " " + snapshot.val().Last_Name + " <i data-feather='chevron-down'></i>";
		    	// load icon module
		    	feather.replace();

		    	// load notification status
		    	notificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications");
		    	notificationRef.once("value", function(snapshot) {
		    		notificationStatus = snapshot.val().Notification_Status;
		    		toggleNotifications();
		    	});

		    	// load social data
		    	socialRef = firebase.database().ref("accounts/" + uidKey + "/social");
		    	socialRef.once("value", function(snapshot) {
		    		availabilityModeStatus = snapshot.val().Mode;
		    		console.log(snapshot.val());
		    		availabilityMode();
		    	});
				
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

	// availablity mode
	document.getElementById("toggleMode").addEventListener("click", availabilityMode);

	// fixed search bar for friend list
	document.getElementById("socialAside").addEventListener("scroll", positionSearchbar);

	// toggle search friends
	document.getElementById("toggleSearch").addEventListener("click", showSearchbarFriends);

	// filter friends
	document.getElementById("filterFriends").addEventListener("keyup", filterFriends);
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

// styles for user dropdown menu
function openMenu() {
	document.getElementById("userAccountMenu").classList.add("fadeIn");
	setTimeout(function() {
		document.getElementById("userAccountMenu").classList.remove("fadeIn");
	}, 600);
}

function toggleNotifications() {

	// notification toggle button
	var notificationsOff = document.getElementById("notificationsOff");

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