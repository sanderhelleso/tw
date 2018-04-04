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
				//document.getElementById("overviewTrigger").click();
				
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
	// clear dashboard container
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
			cont.classList.add("pendingFriendRequest") + cont.classList.add("animated") + cont.classList.add("fadeIn");
			cont.id = "friendRequestCont-" + userKey;

			// create avatar and heading
			var headingCont = document.createElement("div");
			var avatar = document.createElement("img");
			avatar.id = "friendRequest-" + child.key;
			avatar.classList.add("pendingFriendRequestAvatar");
			avatar.addEventListener("click", openProfile)

			// avatar img
			var requestRef = firebase.database().ref("accounts/" + child.key)
			requestRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					avatar.src = snapshot.val().Avatar_url;
				}

				else {
					avatar.src = "/img/avatar.png";
				}
			});
			
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

  		// show notification icon
  		if (count === 0) {
  			document.getElementById("friendRequestNotification").style.display = "none";
  		}

  		else {
  			document.getElementById("friendRequestNotification").style.display = "block";
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
			document.getElementById("notificationNotification").style.display = "block";
		}

		else {
			document.getElementById("notificationNotification").style.display = "none";
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
			cont.id = "chat-" + child.key;
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
			options.childNodes[2].addEventListener("click", openChat);
			document.getElementById("friendsListCont").appendChild(cont);

			//cont.addEventListener("click", openProfile);
		});
		// set width of fixed friendlist heading
		var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
		document.getElementById("friendsListHeadingCont").style.width = width + "px";
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

	// display default message if no notifications are present and show icon
	if (notificationCount === 0) {
		document.getElementById("notificationPlaceholder").innerHTML = "No new notifications, you are good to go!";
		document.getElementById("notificationPlaceholder").style.display = "block";
		document.getElementById("notificationNotification").style.display = "none";
	}

	else {
		document.getElementById("notificationNotification").style.display = "block";
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

			// turn off notification notification
			document.getElementById("notificationNotification").style.display = "none";
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

			if (notifications.length >= 1) {
				document.getElementById("notificationNotification").style.display = "block";
			}
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

// open a chat with selected user
function openChat() {
	// clear and display chat
	clear();
	document.getElementById("socialiconCont").style.display = "none";
	document.getElementById("chatCont").style.display = "block";
	document.getElementById("socialTrigger").click();

	// scroll to bottom
	var chatContScroll = document.getElementById("mainChatCont");
	chatContScroll.scrollTop = chatContScroll.scrollHeight;

	// variables for name and time
	var nameAccount;
	var nameProfile;
	var timestamp;

	accountRef.once("value", function(snapshot) {
		nameAccount = snapshot.val().First_Name.capitalizeFirstLetter();
	});

	var key = this.parentElement.parentElement.id.split("-")[1];
	var chatRef = firebase.database().ref("accounts/" + key);
	chatRef.once("value", function(snapshot) {
		nameProfile = snapshot.val().First_Name.capitalizeFirstLetter();
		// set data about user in chat
		document.getElementById("chattingWith").innerHTML = "Now chatting with " + snapshot.val().First_Name.capitalizeFirstLetter();
		document.getElementById("chatAvatar").src = snapshot.val().Avatar_url;
	});

	// get timestamp
	var now = new Date(); 
	var hour = now.getHours();
 	var minute = now.getMinutes();

	// add zeros if needed 
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}

	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	timestamp = hour + ' ' + minute;  

	// load chats
	var offset;
	var accountChatRef = firebase.database().ref("accounts/" + uidKey + "/chat/" + key);
	var profileChatRef = firebase.database().ref("accounts/" + key + "/chat/" + uidKey);
	accountChatRef.once("value", function(snapshot) {
		console.log(snapshot.val());
		offset = snapshot.val();
	});

	profileChatRef.once("value", function(snapshot) {
		console.log(snapshot.val());
	});

	// init send message
	document.getElementById("sendChatMessage").addEventListener("click", sendChatMessage);

	// send message
	function sendChatMessage() {
		// message
		var chatMessage = document.getElementById("writeChatMessage");
		var sendMessageRef = firebase.database().ref("accounts/" + uidKey + "/chat/" + key + "/" + new Date().getTime());
		sendMessageRef.update({
			name: nameAccount,
			message: chatMessage.value,
			time: timestamp,
			timestamp: firebase.database.ServerValue.TIMESTAMP
		});
		// reset message input
		chatMessage.value = "";
		// scroll to bottom
		var chatContScroll = document.getElementById("mainChatCont");
		chatContScroll.scrollTop = chatContScroll.scrollHeight;
	}
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
	var blockedUsers = [];
	var notBlocked = 0;
	var notFoundCount = 0;
	var foundCount = 0;

	// find blocked users
	blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked");
  	blockedRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			blockedUsers.push(child.key);
	  	});
	});

	// get all users
	allAccountsRef = firebase.database().ref("accounts/");
	allAccountsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			arr.push(child.val());
			keys.push(child.key);
  		});

  		// reset before displaying results
		document.getElementById("searchResults").innerHTML = "";

		// loop through accounts
  		for (var i = 0; i < arr.length; i++) {
  			// exclude signed in user from search
			if (keys[i] != uidKey) {
				notBlocked++;
				// check for matches
				console.log(arr[i]);
				if (search.value.toLowerCase() === arr[i].Email || arr[i].First_Name.toLowerCase() + " " + arr[i].Last_Name.toLowerCase() === search.value.toLowerCase()) {
					foundCount++;

					// add scrollbar to container if needed
					document.getElementById("socialMain").style.overflowY = "scroll";

					// create elements
					var cont = document.createElement("div");
					cont.id = keys[i];
					cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("text-center") + cont.classList.add("animated");
					var name = document.createElement("h5");
					name.innerHTML = arr[i].First_Name.capitalizeFirstLetter() + " " + arr[i].Last_Name.capitalizeFirstLetter();
					var email = document.createElement("p");
					email.innerHTML = arr[i].Email.toLowerCase();
					var avatar = document.createElement("img");
					avatar.classList.add("searchResultsAvatar");
					avatar.src = arr[i].Avatar_url;
					avatar.id = "profile-" + keys[i];
					var bio = document.createElement("p");
					bio.classList.add("bio");
					var icons = document.createElement("span");
					icons.classList.add("searchResultsIcons");
					icons.innerHTML = document.getElementById("masterResult").childNodes[1].innerHTML;

					// append
					cont.appendChild(name);
					cont.appendChild(email);
					cont.appendChild(avatar);
					cont.appendChild(icons);

					// init open profile event
					avatar.addEventListener("click", openProfile);

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

					// check if profile have blocked users, remove if cont id matches
					var profileBlockedUsersRef = firebase.database().ref("accounts/" + avatar.id.split("-")[1] + "/blocked");
					profileBlockedUsersRef.once("value", function(snapshot) {
						if (snapshot.val() != null || snapshot.val() != undefined) {
							cont.remove();
							// subtract from count
							foundCount--;
						}

						// show success message
						document.getElementById("searchNewFriendError").style.display = "none";
						document.getElementById("searchNewFriendSuccess").style.display = "block";
						document.getElementById("searchNewFriendSuccess").innerHTML = "We succesfully found <strong>" + foundCount + "</strong> accounts connected to your search!"; 
					});

					// display results
					cont.classList.add("fadeInUp");
					document.getElementById("searchResults").appendChild(cont);

					// scroll animation to results
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
	console.log(123);
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
var profileRequestKey;
function acceptFriendRequest() {
	// get user key
	var userKey;
	var friendCont;
	if (this.classList.contains("acceptFriendRequest")) {
		userKey = this.parentElement.parentElement.parentElement.id.split("-")[1];
		friendCont = this.parentElement.parentElement.parentElement;
	}

	else if (this.classList.contains("acceptFriendRequestProfile")) {
		userKey = profileRequestKey;
		friendCont = document.getElementById("friendRequestCont-" + userKey);
	}

	var friendRef = firebase.database().ref("accounts/" + uidKey + "/friends/" + userKey);
	var acceptedFriendRef = firebase.database().ref("accounts/" + userKey + "/friends/" + uidKey);
	
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

		// create friend element and display in profile page
		var cont = document.createElement("div");
		cont.id = "profile-" + snapshot.key;
		cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + snapshot.key);

		// create avatar img
		var friendImg = document.createElement("img");
		friendImg.classList.add("friendsAvatar");

		// set img src to be avatar url
		friendRef = firebase.database().ref("accounts/" + snapshot.key);
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
		friendName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();

		// create friend email
		var friendEmail = document.createElement("p");
		friendEmail.classList.add("friendsEmail");
		friendEmail.innerHTML = snapshot.val().Email;

		// append
		cont.appendChild(friendImg);
		cont.appendChild(friendName);
		cont.appendChild(friendEmail);

		// add event listener to container, used to open the selected profile
		cont.addEventListener("click", openProfile);

		// display
		document.getElementById("profileFriendsRow").appendChild(cont);


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

		// show notification icon
  		if (amountOfRequests - 1 === 0) {
  			document.getElementById("friendRequestNotification").style.display = "none";
  		}

  		else {
  			document.getElementById("friendRequestNotification").style.display = "block";
  		}

  		// hide add friend profile button
  		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "none";
	});
}

// decline friend request
function declineFriendRequest() {
	// hide profile
	$('#profileModal').modal('hide');
	// get user key
	var userKey;
	var friendCont;
	if (this.classList.contains("declineFriendRequest")) {
		userKey = this.parentElement.parentElement.parentElement.id.split("-")[1];
		friendCont = this.parentElement.parentElement.parentElement;
	}

	else if (this.classList.contains("declineFriendRequestProfile")) {
		userKey = profileRequestKey;
		friendCont = document.getElementById("friendRequest-" + userKey);
	}
	// remove friend request
	var friendRequestRef = firebase.database().ref("accounts/" + uidKey + "/friend_requests/" + userKey);
	friendRequestRef.remove();
	friendCont.remove();

	// get current amount and update message
	var amountOfRequests = parseInt(document.getElementById("friendRequestPlaceholder").innerHTML.split(" ")[2]);
	if (amountOfRequests - 1 === 1) {
		document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend request";
	}

	else {
		document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend requests";
	}

	// show notification icon
 	if (amountOfRequests - 1 === 0) {
		document.getElementById("friendRequestNotification").style.display = "none";
  	}

 	else {
  		document.getElementById("friendRequestNotification").style.display = "block";
  	}

  	// hide add friend profile button
  	document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "none";
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
	// clear dashboard container
	clear();

	// clear cont and load account friends and blocked users
	document.getElementById("profileFriendsRow").innerHTML = "";
	loadProfileFriends();
	loadBlockedUsers();

	// hide social
	document.getElementById("socialMain").style.display = "none";
	document.getElementById("socialAside").style.display = "none";

	// show profile
	document.getElementById("mainProfile").style.display = "block";
	document.getElementById("profileCont").style.display = "block"
	// new password btn
	document.getElementById("changeProfilePassword").addEventListener("click", updatePassword);

	// init update profile events
	var inputs = document.getElementsByClassName("settingsInput");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].addEventListener("keyup", updateProfile);
	}

	// init social media events
	document.getElementById("addGithubURL").addEventListener("click", addGithubURL);
	document.getElementById("addLinkedinURL").addEventListener("click", addLinkedinURL);
	document.getElementById("addInstagramURL").addEventListener("click", addInstagramURL);
	document.getElementById("addFacebookURL").addEventListener("click", addFacebookURL);
	document.getElementById("addTwitterURL").addEventListener("click", addTwitterURL);

	// load profile data
	accountRef.once("value", function(snapshot) {
		// set profile data into settings
		if (snapshot.val().Bio != undefined) {
			document.getElementById("bioTextarea").value = snapshot.val().Bio;
		}
		
		document.getElementById("firstNameProfile").value = snapshot.val().First_Name;
		document.getElementById("lastNameProfile").value = snapshot.val().Last_Name;
		document.getElementById("emailProfile").value = snapshot.val().Email;
	});

	// load social media links into setting inputs and add them to profile links
	var socialMediaRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias");
	socialMediaRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			if (child.key === "facebook") {
				document.getElementById("facebookURL").value = child.val().URL;
				document.getElementById("profileFacebook").href = "https://www." + child.val().URL;
				document.getElementById("profileFacebook").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[2].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[2].addEventListener("click", removeFacebookURL);

			}

			if (child.key === "github") {
				document.getElementById("githubURL").value = child.val().URL;
				document.getElementById("profileGithub").href = "https://www." + child.val().URL;
				document.getElementById("profileGithub").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[0].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[0].addEventListener("click", removeGithubURL);
			}

			if (child.key === "instagram") {
				document.getElementById("instagramURL").value = child.val().URL;
				document.getElementById("profileInstagram").href = "https://www." + child.val().URL;
				document.getElementById("profileInstagram").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[3].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[3].addEventListener("click", removeInstagramURL);
			}

			if (child.key === "linkedin") {
				document.getElementById("linkedinURL").value = child.val().URL;
				document.getElementById("profileLinkedin").href = "https://www." + child.val().URL;
				document.getElementById("profileLinkedin").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[1].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[1].addEventListener("click", removeLinkedinURL);
			}

			if (child.key === "twitter") {
				document.getElementById("twitterURL").value = child.val().URL;
				document.getElementById("profileTwitter").href = "https://www." + child.val().URL;
				document.getElementById("profileTwitter").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[4].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[4].addEventListener("click", removeTwitterURL);
			}
		});
	});
}

// load account friends
function loadProfileFriends() {
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		console.log(snapshot.val());
		// if no friends are present, display container
		if (snapshot.val() === null || snapshot.val() === undefined) {
			document.getElementById("noFriendsRow").style.display = "block";
		}

		else {
			document.getElementById("noFriendsRow").style.display = "none";
		}
		snapshot.forEach((child) => {
			
			// create friend container
			var cont = document.createElement("div");
			cont.id = "profile-" + child.key;
			cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + child.key);

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

// load all blocked user
function loadBlockedUsers() {
	var blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked");
	blockedRef.once("value", function(snapshot) {
		// check for users
		if (snapshot.val() === null || snapshot.val() === undefined) {
			document.getElementById("blockedUsersRow").style.display = "none";
		}

		else {
			document.getElementById("blockedUsersRow").style.display = "block";
		}

		// get users
		snapshot.forEach((child) => {
			var blockedUserRef = firebase.database().ref("accounts/" + child.key);
			blockedUserRef.once("value", function(snapshot) {
				var cont = document.createElement("div");
				cont.id = "blokced-" + child.key;
				cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileBlockedCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("blocked-" + child.key);

				// create avatar img
				var userImg = document.createElement("img");
				userImg.classList.add("blockedAvatar");

				// unblur pic on click
				userImg.addEventListener("click", unblurBlocked);

				// set img src to be avatar url
				userImgRef = firebase.database().ref("accounts/" + child.key);
				userImgRef.once("value", function(snapshot) {
					if (snapshot.val().Avatar_url != undefined) {
						userImg.src = snapshot.val().Avatar_url;
					}

					else {
						userImg.src = "/img/avatar.png";
					}
				});

				// create user name
				var userName = document.createElement("h5");
				userName.classList.add("blockedName");
				userName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();

				// unblock btn
				var unblockTrigger =  document.createElement("p");
				unblockTrigger.classList.add("unblockUser") + unblockTrigger.classList.add("text-center");
				unblockTrigger.innerHTML = "Unblock";
				unblockTrigger.addEventListener("click", unblock);

				// append to cont
				cont.appendChild(userImg);
				cont.appendChild(userName);
				cont.appendChild(unblockTrigger);

				// display
				document.getElementById("blockedUsersRow").appendChild(cont);
			});
		});
	});
	// init display blocked users
	document.getElementById("toggleBlockedUsers").addEventListener("click", displayBlocked);
}

// unblocks the user
function unblock() {
	// get key and remove
	var key = this.parentElement.id.split("-")[1];
	var blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked/" + key);
	blockedRef.remove();
	this.parentElement.remove();

	// show message
	snackbar.innerHTML = "User unblocked! You can now interact with the user again.";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// toggle blocked users
var blockedCheck = false;
function displayBlocked() {
	// get profiles
	var blocked = document.getElementsByClassName("profileBlockedCont");

	// show
	if (blockedCheck === false) {
		blockedCheck = true;
		this.innerHTML = "Hide";
		for (var i = 0; i < blocked.length; i++) {
			blocked[i].style.display = "block";
		}
	}

	// hide
	else {
		blockedCheck = false;
		this.innerHTML = "Show";
		for (var i = 0; i < blocked.length; i++) {
			blocked[i].style.display = "none";
		}
	}
}

var settingsKey;
function openProfile() {
	// get profile key
	var profileKey = this.id.split("-")[1];
	profileRequestKey = profileKey;

	// check if profile is from friend request
	if (this.id.split("-")[0] === "friendRequest") {
		document.getElementById("unfriendUser").style.display = "none";
		document.getElementById("unfriendDivider").style.display = "none";
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "block";

		// event listener for add friend button
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].childNodes[0].addEventListener("click", acceptFriendRequest);

		// event listener for decline friend button
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].childNodes[2].addEventListener("click", declineFriendRequest);
	}

	else {
		document.getElementById("unfriendUser").style.display = "block";
		document.getElementById("unfriendDivider").style.display = "block";
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "none";
	}

	// used to controll settings
	settingsKey = profileKey;

	// remove options (unfriend, report, block) if profile is account
	if (profileKey === uidKey) {
		document.getElementById("profileModalSettings").style.display = "none";
	}

	else {
		document.getElementById("profileModalSettings").style.display = "block";
	}

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

		// check if profile is friend with account
		var isFriendRef = firebase.database().ref("accounts/" + uidKey + "/friends/" + profileKey)
		isFriendRef.once("value", function(snapshot) {
			// remove UNFRIEND option if account is not friend with profile
			if (snapshot.val() != null || snapshot.val() != undefined) {
				document.getElementById("unfriendUser").style.display = "block";
				document.getElementById("unfriendDivider").style.display = "block";
			}

			else {
				document.getElementById("unfriendUser").style.display = "none";
				document.getElementById("unfriendDivider").style.display = "none";
			}
		});

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

		// check for blocked users
		var blockedUsers = [];

		var myFriendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
		var profileFriendsRef = firebase.database().ref("accounts/" + profileKey + "/friends");
		myFriendsRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				friends.push(child.key);
			});
		});

		// find blocked users
		blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked");
	  	blockedRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				blockedUsers.push(child.key);
		  	});
		});

	  	// get profile friends
		profileFriendsRef.once("value", function(snapshot) {
			// reset friends cont before appending
			document.getElementById("profileModalFriendsRow").innerHTML = "";
			document.getElementById("commonFriends").innerHTML = "";
			snapshot.forEach((child) => {

				// push profile friends to array
				profileFriends.push(child.key);

				// create friend container
				var cont = document.createElement("div");
				cont.id = "profile-" + child.key;
				cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileModalFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + child.key);

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
				document.getElementById("commonFriends").innerHTML = "";
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

					// set amount of common friends
					document.getElementById("commonFriends").innerHTML = commonsCount + " common";

					// settings available
					document.getElementById("profileModalSettings").style.display = "inline-block";
				}

				// display
				document.getElementById("profileModalFriendsRow").appendChild(cont);

				// if user is blocked, remove
				for (var i = 0; i < blockedUsers.length; i++) {
					if (cont.id.split("-")[1] === blockedUsers[i]) {
						cont.remove();
					}
				}

				// check if profile have blocked users, remove if cont id matches
				var profileBlockedUsersRef = firebase.database().ref("accounts/" + cont.id.split("-")[1] + "/blocked");
				profileBlockedUsersRef.once("value", function(snapshot) {
					if (snapshot.val() != null || snapshot.val() != undefined) {
						cont.remove();
					}
				});
			});

			// display no friend message if the user have no friends
			if (profileFriends.length === 0) {
				document.getElementById("foreverAlone").style.display = "block";
			}

			else {
				document.getElementById("foreverAlone").style.display = "none";
			}

			// resets links before appending
			var socialRow = document.getElementById("connectWithProfileRow").childNodes;
			for (var i = 0; i < socialRow.length; i++) {
				if (socialRow[i].tagName === "A") {
					socialRow[i].style.display = "none";
				}
			}

			// display social links
			var socialMediaRef = firebase.database().ref("accounts/" + profileKey + "/socialMedias");
			socialMediaRef.once("value", function(snapshot) {

				// check if profile have social media links conneted
				if (snapshot.val() === null) {
					document.getElementById("noConnections").style.display = "block";
				}

				else {
					document.getElementById("noConnections").style.display = "none";
				}

				snapshot.forEach((child) => {
					if (child.key === "facebook") {
						document.getElementById("profileFacebookModal").href = "https://www." + child.val().URL;
						document.getElementById("profileFacebookModal").style.display = "block";
					}

					if (child.key === "github") {
						document.getElementById("profileGithubModal").href = "https://www." + child.val().URL;
						document.getElementById("profileGithubModal").style.display = "block";
					}

					if (child.key === "instagram") {
						document.getElementById("profileInstagramModal").href = "https://www." + child.val().URL;
						document.getElementById("profileInstagramModal").style.display = "block";
					}

					if (child.key === "linkedin") {
						document.getElementById("profileLinkedinModal").href = "https://www." + child.val().URL;
						document.getElementById("profileLinkedinModal").style.display = "block";
					}

					if (child.key === "twitter") {
						document.getElementById("profileTwitterModal").href = "https://www." + child.val().URL;
						document.getElementById("profileTwitterModal").style.display = "block";
					}
				});
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
	cancelBlock();
}

function unblurBlocked() {
	if (this.style.filter === "none") {
		this.style.filter = "blur(2px)";
	}

	else {
		this.style.filter = "none";
	}
}

// unfriend selected user
function unfriendUser() {

	// close potensial other options
	document.getElementById("cancelReport").click();
	document.getElementById("cancelBlock").click();

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

function confirmUnfriend() {
	// remove user from account and account from user, get refs
	var unfriendUser = firebase.database().ref("accounts/" + uidKey + "/friends/" + settingsKey);
	var unfriendAccount = firebase.database().ref("accounts/" + settingsKey + "/friends/" + uidKey);

	// remove connection from both accounts
	unfriendUser.remove();
	unfriendAccount.remove();

	// remove friend from DOM
	var friend = document.getElementsByClassName("profile-" + settingsKey);
	friend[0].remove();

	// display message
	snackbar.innerHTML = "You are no longer friends with " + document.getElementById("profileModalName").innerHTML.split(" ")[0];
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

	// hide modal
	$('#profileModal').modal('hide');
}

// report selected user
function reportUser() {

	//close potensial other options
	document.getElementById("cancelUnfriend").click();
	document.getElementById("cancelBlock").click();

	// display report form
	document.getElementById("reportReasonCont").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// set label
	document.getElementById("reportReasonLabel").innerHTML = "Are you sure you want to report " + document.getElementById("profileModalName").innerHTML.split(" ")[0] + "?";


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
	// close potensial other options
	document.getElementById("cancelReport").click();
	document.getElementById("cancelUnfriend").click();

	// display report form
	document.getElementById("blockCont").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// set label
	document.getElementById("blockLabel").innerHTML = "Are you sure you want to block " + document.getElementById("profileModalName").innerHTML.split(" ")[0] + "?";

	// init cancel and confirm events
	document.getElementById("cancelBlock").addEventListener("click", cancelBlock);
	document.getElementById("confirmBlock").addEventListener("click", confirmBlock);
}

function cancelBlock() {
	// hide block form and remove blur from avatar image
	document.getElementById("blockCont").style.display = "none";
	document.getElementById("profileModalAvatar").style.filter = "none";
}

function confirmBlock() {
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

	// store block
	var reportRef = firebase.database().ref("accounts/" + uidKey + "/blocked/" + settingsKey);
	reportRef.update({
		Timestamp: dateTime
	});

	// remove user from account and account from user, get refs
	var unfriendUser = firebase.database().ref("accounts/" + uidKey + "/friends/" + settingsKey);
	var unfriendAccount = firebase.database().ref("accounts/" + settingsKey + "/friends/" + uidKey);

	// remove connection from both accounts
	unfriendUser.remove();
	unfriendAccount.remove();

	// remove friend from DOM
	var friend = document.getElementsByClassName("profile-" + settingsKey);
	friend[0].remove();

	// close block
	document.getElementById("cancelBlock").click();

	// display message
	snackbar.innerHTML = "The user have now been blocked! They will no longer be able to see or interact with this you.";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

	// close modal
	$('#profileModal').modal('hide');
}

function updateProfile() {
	//cancel and confirm buttons
	var cancel = document.getElementById("cancelProfileUpdateCont");
	var update = document.getElementById("confirmProfileUpdateCont");

	// original input values
	var bio;
	var firstName;
	var lastName;
	var email;

	// get inputs and store in variables
	var inputs = document.getElementsByClassName("settingsInput");
	bio = inputs[0].value;
	firstName = inputs[1].value;
	lastName = inputs[2].value;
	email = inputs[3].value;

	var settingsRef = firebase.database().ref("accounts/" + uidKey);
	settingsRef.once("value", function(snapshot) {
		// if changes are made, add event to buttons
		if (snapshot.val().Bio != bio || snapshot.val().First_Name != firstName || snapshot.val().Last_Name != lastName || snapshot.val().Email != email) {
			cancel.style.opacity = "1";
			update.style.opacity = "1";

			// add events
			cancel.addEventListener("click", cancelProfileUpdate);
			update.addEventListener("click", confirmProfileUpdate);
		}

		else {
			cancel.style.opacity = "0.3";
			update.style.opacity = "0.3";

			// remove events
			cancel.removeEventListener("click", cancelProfileUpdate);
			update.removeEventListener("click", confirmProfileUpdate);
		}
	});

	console.log(bio);
}

function cancelProfileUpdate() {
	// reset settings
	var settingsRef = firebase.database().ref("accounts/" + uidKey);
	settingsRef.once("value", function(snapshot) {
		var inputs = document.getElementsByClassName("settingsInput");
		inputs[0].value = snapshot.val().Bio;
		inputs[1].value = snapshot.val().First_Name;
		inputs[2].value = snapshot.val().Last_Name;
		inputs[3].value = snapshot.val().Email;
		updateProfile();

		// remove event instant
		document.getElementById("cancelProfileUpdateCont").removeEventListener("click", cancelProfileUpdate);
		document.getElementById("confirmProfileUpdateCont").removeEventListener("click", confirmProfileUpdate);
	});
}

// update profile
var emailConfirmation = false;
function confirmProfileUpdate() {
	// get setting value ref
	var settingsRef = firebase.database().ref("accounts/" + uidKey);
	settingsRef.once("value", function(snapshot) {
		var inputs = document.getElementsByClassName("settingsInput");

		// bio
		if (inputs[0].value != snapshot.val().Bio && inputs[0].value.length >= 2) {
			settingsRef.update({
				Bio: inputs[0].value
			});
			snackbar.innerHTML = "Profile succesfully updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// update and reset if ok
			cancelProfileUpdate();
		}

		// first name
		if (inputs[1].value != snapshot.val().First_Name && inputs[1].value.length >= 2) {
			settingsRef.update({
				First_Name: inputs[1].value
			});
			snackbar.innerHTML = "Profile succesfully updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// update and reset if ok
			cancelProfileUpdate();
		}

		// last name
		if (inputs[2].value != snapshot.val().Last_Name && inputs[2].value.length >= 2) {
			settingsRef.update({
				Last_Name: inputs[2].value
			});
			snackbar.innerHTML = "Profile succesfully updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// update and reset
			cancelProfileUpdate();
		}

		// check for valid email
		regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		OK = regEx.test(inputs[3].value);
		if (!OK) {
			snackbar.innerHTML = "Please enter a valid email! " + inputs[3].value + " is not a valid email";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
			return;
		}

		// update email
		if (inputs[3].value != snapshot.val().Email && OK) {
			console.log("ok");
			// get user
			var user = firebase.auth().currentUser;
			user.updateEmail(inputs[3].value).then(function() {
				settingsRef.update({
					Email: inputs[3].value
				});
				snackbar.innerHTML = "Profile succesfully updated!";
				snackbar.className = "show";
				setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
				cancelProfileUpdate();
			  // Update successful.
			}).catch(function(error) {

				// display error and prompt re-authenticate modal
			  	$('#authenticateModalCont').modal('show');

			  	// confirms that email shall be updated if re-authenticated
			  	emailConfirmation = true;

			  	// init event for re-authentication
			  	document.getElementById("loginBtn").addEventListener("click", authenticate);
			});
		}
	});
}

// open update password modal and trigger event to change password
function updatePassword() {
	// show modal
	$('#changePasswordModalCont').modal('show');

	// init update password event
	document.getElementById("changePasswordBtn").addEventListener("click", confirmUpdatePassword);
}

var passConfirmation = false;
function confirmUpdatePassword() {
	// get values
	var password = document.getElementById("newPassword");
	var confirmPassword = document.getElementById("confirmPassword");
	// check for secure password
	regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
	OK = regEx.test(password.value);

	if (!OK) {
		document.getElementById("changePasswordErrorMessage").style.display = "block";
		document.getElementById("changePasswordErrorMessage").innerHTML = "Password needs to contain the following: <strong><br>1 Uppercase letter<br>1 Lowercase letter<br>1 Number<br>8 Characters long</strong>";
		return;
	}

	if (password.value != confirmPassword.value) {
		document.getElementById("changePasswordErrorMessage").style.display = "block";
		document.getElementById("changePasswordErrorMessage").innerHTML = "Passwords dont match! Please try again";
		return;
	}
	
	// update password
	var user = firebase.auth().currentUser;
	user.updatePassword(password.value).then(function() {
	  	// Update successful.
	 	$('#changePasswordModalCont').modal('hide');
	  	snackbar.innerHTML = "Profile succesfully updated!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

		// reset form
		password.value = "";
		confirmPassword.value = "";
	}).catch(function(error) {
	  // An error happened.

	  // display re-authenticate modal and hide change password modal
	  $('#changePasswordModalCont').modal('hide');
	  $('#authenticateModalCont').modal('show');

	  // confirms that email shall be updated if re-authenticated
	  passConfirmation = true;
	});
}

// re-authenticate the user
function authenticate() {
	// get values
	var inputs = document.getElementsByClassName("settingsInput");
	var user = firebase.auth().currentUser;
	var email = document.getElementById("loginEmail").value;
	var password = document.getElementById("loginPassword").value;
	var credentials = firebase.auth.EmailAuthProvider.credential(email, password);

	// Prompt the user to re-provide their sign-in credentials
	user.reauthenticateWithCredential(credentials).then(function() {
	  	// User re-authenticated.
	  	$('#authenticateModalCont').modal('hide');

	  	// get setting value ref
		var settingsRef = firebase.database().ref("accounts/" + uidKey);
		settingsRef.once("value", function(snapshot) {

			// check for confirmation
			if (emailConfirmation === true) {
				// update email
				var updatedEmail = document.getElementById("emailProfile").value;
				user.updateEmail(updatedEmail);
				settingsRef.update({
					Email: updatedEmail
				});

				// display message
				snackbar.innerHTML = "Profile succesfully updated!";
				snackbar.className = "show";
				setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
				cancelProfileUpdate();
			}

			if (passConfirmation === true) {
				console.log(123);
				// update password
				var password = document.getElementById("confirmPassword").value;
				var user = firebase.auth().currentUser;
				user.updatePassword(password);

				// display message
				snackbar.innerHTML = "Profile succesfully updated!";
				snackbar.className = "show";
				setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
				cancelProfileUpdate();

				// reset form
				document.getElementById("newPassword").value = "";
				password = "";
			}
		});
	}).catch(function(error) {
	  // An error happened, and display message
	  document.getElementById("authenticateError").style.display = "block";
	  document.getElementById("authenticateErrorMsg").innerHTML = error.message;
	  return;
	});
}

// add github
function addGithubURL() {
	// get github ref
	var githubRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/github");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("githubURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("githubURL").value;
	if (url[0].toLowerCase() === "https://github." || url[0].toLowerCase() === "www.github." || url[0].toLowerCase() === "github.") {
		// add URL to profile
		githubRef.update({
			URL: validURL
		});

		// display message
		errorMessage[0].innerHTML = "GtHub succesfully added to your profile!";
		errorMessage[0].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[0].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[0].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[0].addEventListener("click", removeGithubURL);

		document.getElementById("profileGithub").href = "https://www." + validURL;
		document.getElementById("profileGithub").style.display = "block";
	}

	else {
		// display error message
		errorMessage[0].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[0].style.color = "#ef5350";
		return;
	}
}

// add linkedin
function addLinkedinURL() {
	// get github ref
	var linkedinRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/linkedin");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("linkedinURL").value.toLowerCase().split(".com/");
	var validURL = document.getElementById("linkedinURL").value;
	console.log(url[1].split("/"));
	if (url[1].split("/")[0].toLowerCase() === "in" || url[1].split("/")[0] === "in" && url[1].split("/")[1] != "" && url[0].split("/")[0].toLowerCase() === "linkedin") {
		console.log(url[1].split("/"));
		// add URL to profile
		linkedinRef.update({
			URL: validURL
		});

		// display message
		errorMessage[1].innerHTML = "LinkedIn succesfully added to your profile!";
		errorMessage[1].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[1].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[1].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[1].addEventListener("click", removeLinkedinURL);

		document.getElementById("profileLinkedin").href = "https://www." + validURL;
		document.getElementById("profileLinkedin").style.display = "block";
	}

	else {
		// display error message
		errorMessage[1].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[1].style.color = "#ef5350";
		return;
	}
}

// add instagram
function addInstagramURL() {
	// get instagram ref
	var instagramRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/instagram");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("instagramURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("instagramURL").value;
	console.log(url);
	if (url[0].toLowerCase() === "https://www.instagram." || url[0].toLowerCase() === "www.instagram." || url[0].toLowerCase() === "instagram.") {
		// add URL to profile
		instagramRef.update({
			URL: validURL
		});

		// display message
		errorMessage[2].innerHTML = "Instagram succesfully added to your profile!";
		errorMessage[2].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[2].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[2].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[2].addEventListener("click", removeInstagramURL);

		document.getElementById("profileInstagram").href = "https://www." + validURL;
		document.getElementById("profileInstagram").style.display = "block";
	}

	else {
		// display error message
		errorMessage[2].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[2].style.color = "#ef5350";
		return;
	}
}

// add github
function addFacebookURL() {
	// get facebookref
	var facebookRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/facebook");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("facebookURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("facebookURL").value;
	console.log(url);
	if (url[0].toLowerCase() === "https://www.facebook." || url[0].toLowerCase() === "www.facebook." || url[0].toLowerCase() === "facebook.") {
		// add URL to profile
		facebookRef.update({
			URL: validURL
		});

		// display message
		errorMessage[3].innerHTML = "Facebook succesfully added to your profile!";
		errorMessage[3].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[3].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[3].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[3].addEventListener("click", removeFacebookURL);

		document.getElementById("profileFacebook").href = "https://www." + validURL;
		document.getElementById("profileFacebook").style.display = "block";
	}

	else {
		// display error message
		errorMessage[3].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[3].style.color = "#ef5350";
		return;
	}
}

// add twitter
function addTwitterURL() {
	// get twitter ref
	var twitterRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/twitter");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("twitterURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("twitterURL").value;
	if (url[0].toLowerCase() === "https://twitter." || url[0].toLowerCase() === "www.twitter." || url[0].toLowerCase() === "twitter.") {
		// add URL to profile
		twitterRef.update({
			URL: validURL
		});

		// display message
		errorMessage[4].innerHTML = "Twitter succesfully added to your profile!";
		errorMessage[4].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[4].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[4].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[4].addEventListener("click", removeTwitterURL);

		document.getElementById("profileTwitter").href = "https://www." + validURL;
		document.getElementById("profileTwitter").style.display = "block";
	}

	else {
		// display error message
		errorMessage[4].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[4].style.color = "#ef5350";
		return;
	}
}

// global for message
var errorMessage = document.getElementsByClassName("socialMediaError");

// remove github from account
function removeGithubURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileGithub").style.display = "none";
	document.getElementById("githubURL").value = "";
	var githubRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/github");
	githubRef.remove();

	// display message
	errorMessage[0].innerHTML = "GitHub succesfully removed from your profile!";
	errorMessage[0].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[0].innerHTML = "";
	}, 3000);
}

// remove linkedin from account
function removeLinkedinURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileLinkedin").style.display = "none";
	document.getElementById("linkedinURL").value = "";
	var linkedinRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/linkedin");
	linkedinRef.remove();

	// display message
	errorMessage[1].innerHTML = "LinkedIn succesfully removed from your profile!";
	errorMessage[1].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[1].innerHTML = "";
	}, 3000);

}

// remove instagram from accont
function removeInstagramURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileInstagram").style.display = "none";
	document.getElementById("instagramURL").value = "";
	var instagramRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/instagram");
	instagramRef.remove();

	// display message
	errorMessage[2].innerHTML = "Instagram succesfully removed from your profile!";
	errorMessage[2].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[2].innerHTML = "";
	}, 3000);

}

// remove facebook from account
function removeFacebookURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileFacebook").style.display = "none";
	document.getElementById("facebookURL").value = "";
	var facebookRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/facebook");
	facebookRef.remove();

	// display message
	errorMessage[3].innerHTML = "Facebook succesfully removed from your profile!";
	errorMessage[3].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[3].innerHTML = "";
	}, 3000);
}

// remove twitter from account
function removeTwitterURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileTwitter").style.display = "none";
	document.getElementById("twitterURL").value = "";
	var twitterRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/twitter");
	twitterRef.remove();

	// display message
	errorMessage[4].innerHTML = "Twitter succesfully removed from your profile!";
	errorMessage[4].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[4].innerHTML = "";
	}, 3000);
}



/********************************* END PROFILE ***********************************/
