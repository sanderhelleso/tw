window.onload = start;

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

	// load modules
    feather.replace()
    particlesJS.load("particles-js", "/scripts/particles.json", function() {
    	console.log("particles loaded...");
    });

    // init signup and login functions
    document.getElementById("signUpBtn").addEventListener("click", signup);
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("successLogin").addEventListener("click", openLogin);
	document.getElementById("noAccount").addEventListener("click", openSignup);
	document.getElementById("forgotPassword").addEventListener("click", forgotPassword);


    // get form elements
	var firstName = document.getElementById("firstName");
	var lastName = document.getElementById("lastName");
	var email = document.getElementById("email");
	var select = document.getElementById("signupSelect");
	var password = document.getElementById("password");
	var confirmPass = document.getElementById("confirmPassword");

	// set event listeners
	firstName.addEventListener("keyup", checkName);
	lastName.addEventListener("keyup", checkName);
	email.addEventListener("keydown", checkEmail);
	select.addEventListener("change", checkOption);
	password.addEventListener("keyup", checkPassword);
	confirmPass.addEventListener("keyup", checkConfirmPassword);

	// check user
	checkUser();

	// sign out
	/*firebase.auth().signOut().then(function() {
		console.log('Signed Out');
	}, function(error) {
		console.error('Sign Out Error', error);
	});*/
}

function checkUser() {
	firebase.auth().onAuthStateChanged(function(user) {
	  if (user) {
	    var uidKey = user.uid;
	    // display greeting
	    var accountRef = firebase.database().ref("accounts/" + uidKey);
	    console.log(accountRef);
	    accountRef.once("value", function(snapshot) {
	    	document.getElementById("loadingCover").classList.add("fadeOut");
	    	setTimeout(function() {
		    	document.getElementById("loadingCover").style.display = "none";
		    	document.getElementById("body").classList.add("fadeIn");
		    	document.getElementById("dashboardMain").style.display = "block";
				document.getElementById("dashboardMain").classList.add("fadeInUp");
		    },  100);
			console.log(snapshot.val());
			document.getElementById("login").style.display = "none";
		    document.getElementById("getStarted").style.display = "none";
		    document.getElementById("dashboard").style.display = "block";
		    document.getElementById("discoverMain").style.display = "none";
		    document.getElementById("getStartedMain").style.display = "none";
			document.getElementById("mainHeading").innerHTML = "Welcome, " + snapshot.val().First_Name;
			document.getElementById("mainSlogan").innerHTML = "Ready to change the world?";
		});
	  } 

	  else {
	  	document.getElementById("loadingCover").classList.add("fadeOut");
	    setTimeout(function() {
		    document.getElementById("loadingCover").style.display = "none";
		    document.getElementById("body").classList.add("fadeIn");
		},  100);
	    console.log("Not logged in");
	    document.getElementById("login").style.display = "block";
	    document.getElementById("getStarted").style.display = "block";
	    document.getElementById("dashboard").style.display = "none";
	    document.getElementById("discoverMain").style.display = "inline-block";
	    document.getElementById("getStartedMain").style.display = "inline-block";
	    document.getElementById("dashboardMain").style.display = "none";
	  }
	});
}

// check firstname
function checkName() {

	if (this.value.length >= 2 && this.value.length <= 40) {
		this.style.border = "1px solid #66bb6a";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "1";
	}

	else {
		this.style.border = "1px solid #e57373";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "0"
	}

	if (this.value === "") {
		this.removeAttribute("style");
	}
}

// check email
function checkEmail() {
	regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	OK = regEx.test(this.value);

	if (!OK) {
		this.style.border = "1px solid #e57373";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "0"
	}

	else {
		this.style.border = "1px solid #66bb6a";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "1";
	}

	if (this.value === "") {
		this.removeAttribute("style");
	}
}

// check select option
function checkOption() {
	if (this.value != this.parentElement.childNodes[3].childNodes[1].value) {
		this.style.border = "1px solid #66bb6a";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "1";
	}

	else {
		this.style.border = "1px solid #7e57c2";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "0"
		this.removeAttribute("style");
	}
}

// check password
function checkPassword() {

	// min 1 uppercase, 1 lowercase, 1 number, 8 length
	regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
	OK = regEx.test(this.value);

	if (!OK) {
		this.style.border = "1px solid #e57373";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "0"
	}

	else {
		this.style.border = "1px solid #66bb6a";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "1";
	}

	if (this.value === "") {
		this.removeAttribute("style");
	}

	if (document.getElementById("confirmPassword").value != "") {
		if (this.value === document.getElementById("confirmPassword").value) {
			document.getElementById("confirmPassword").style.border = "1px solid #66bb6a";
			document.getElementById("confirmPassword").parentElement.childNodes[1].childNodes[1].style.opacity = "1";
		}

		else {
			document.getElementById("confirmPassword").style.border = "1px solid #ef5350";
			document.getElementById("confirmPassword").parentElement.childNodes[1].childNodes[1].style.opacity = "0";
		}
	}
}

// check confirm password
function checkConfirmPassword() {

	if (this.value === document.getElementById("password").value && document.getElementById("password").value != "") {
		this.style.border = "1px solid #66bb6a";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "1";
	}

	else {
		this.style.border = "1px solid #e57373";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "0";
	}

	if (this.value === "") {
		this.removeAttribute("style");
	}
}

function signup() {

	// dom elements
	var firstName = document.getElementById("firstName");
	var lastName = document.getElementById("lastName");
	var email = document.getElementById("email");
	var select = document.getElementById("signupSelect");
	var password = document.getElementById("password");
	var confirmPass = document.getElementById("confirmPassword");
	var inputs = document.getElementsByClassName("formInput");
	var inputIcons = document.getElementsByClassName("formCheckIcon");

	// error component
	document.getElementById("errorMessage").style.display = "none";
    document.getElementById("errorMessage").classList.remove("bounceIn");
    document.getElementById("errorMessage").innerHTML = "";

	// firstname
	document.getElementById("firstNameError").innerHTML = "";
	document.getElementById("firstNameError").style.opacity = "0";
	if (firstName.value === "" || firstName.value === " ") {
		firstName.style.border = "1px solid #e57373";
		document.getElementById("firstNameError").style.opacity = "1";
		document.getElementById("firstNameError").innerHTML = "First name cant be empty!";
		return;
	}

	if (firstName.value.length < 2) {
		firstName.style.border = "1px solid #e57373";
		document.getElementById("firstNameError").style.opacity = "1";
		document.getElementById("firstNameError").innerHTML = "First name needs to be atleast 2 characters!";
		return;
	}

	if (firstName.value.length > 40) {
		firstName.style.border = "1px solid #e57373";
		document.getElementById("firstNameError").style.opacity = "1";
		document.getElementById("firstNameError").innerHTML = "First name cant be longer than 40 characters!";
		return;
	}

	// lastname
	document.getElementById("lastNameError").innerHTML = "";
	document.getElementById("lastNameError").style.opacity = "0";
	if (lastName.value === "" || lastName.value === " ") {
		lastName.style.border = "1px solid #e57373";
		document.getElementById("lastNameError").style.opacity = "1";
		document.getElementById("lastNameError").innerHTML = "Last name cant be empty!";
		return;
	}

	if (lastName.value.length < 2) {
		lastName.style.border = "1px solid #e57373";
		document.getElementById("lastNameError").style.opacity = "1";
		document.getElementById("lastNameError").innerHTML = "Last name needs to be atleast 2 characters!";
		return;
	}

	if (lastName.value.length > 40) {
		lastName.style.border = "1px solid #e57373";
		document.getElementById("lastNameError").style.opacity = "1";
		document.getElementById("lastNameError").innerHTML = "Last name cant be longer than 40 characters!";
		return;
	}

	// email
	document.getElementById("emailError").innerHTML = "";
	document.getElementById("emailError").style.opacity = "1";
	regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	OK = regEx.test(email.value);

	if (email.value === "" || email.value === " ") {
		email.style.border = "1px solid #e57373";
		document.getElementById("emailError").style.opacity = "1";
		document.getElementById("emailError").innerHTML = "Email cant be empty!";
		return;
	}

	if (!OK) {
		email.style.border = "1px solid #e57373";
		document.getElementById("emailError").style.opacity = "1";
		document.getElementById("emailError").innerHTML = "Please enter a valid email address!";
		return;
	}

	// select
	document.getElementById("selectError").innerHTML = "";
	document.getElementById("selectError").style.opacity = "0";
	if (select.value === select.parentElement.childNodes[3].childNodes[1].value) {
		select.style.border = "1px solid #e57373";
		document.getElementById("selectError").style.opacity = "1";
		document.getElementById("selectError").innerHTML = "Please select an option from the list!";
		return;
	}

	// password
	document.getElementById("passwordError").innerHTML = "";
	document.getElementById("passwordError").style.opacity = "0";
	if (password.value === "" || password.value === " ") {
		password.style.border = "1px solid #e57373";
		document.getElementById("passwordError").style.opacity = "1";
		document.getElementById("passwordError").innerHTML = "Password cant be empty!";
		return;
	}

	regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
	OK = regEx.test(password.value);

	if (!OK) {
		document.getElementById("passwordError").style.opacity = "1";
		document.getElementById("passwordError").innerHTML = "Password needs to contain the following: <strong><br>1 Uppercase letter<br>1 Lowercase letter<br>1 Number<br>8 Characters long</strong>";
		return;
	}

	// confirm password
	document.getElementById("confirmPasswordError").innerHTML = "";
	document.getElementById("confirmPasswordError").style.opacity = "0";
	if (confirmPass.value === "" || confirmPass.value === " ") {
		confirmPass.style.border = "1px solid #e57373";
		document.getElementById("confirmPasswordError").style.opacity = "1";
		document.getElementById("confirmPasswordError").innerHTML = "Confirm password cant be empty!";
		return;
	}

	if (confirmPass.value != password.value) {
		confirmPass.style.border = "1px solid #e57373";
		document.getElementById("confirmPasswordError").style.opacity = "1";
		document.getElementById("confirmPasswordError").innerHTML = "Passwords dont match!";
		return;
	}

	// loading component
    document.getElementById("signupProgress").style.display = "block";

	// create user
	firebase.auth().createUserWithEmailAndPassword(email.value, password.value).then(function(user) {
		document.getElementById("signupProgress").style.display = "none";
		document.getElementById("successLoginCont").style.display = "block";
		document.getElementById("successImg").style.display = "block";
		document.getElementById("successLogin").addEventListener("click", openLogin);
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].removeAttribute("style");
			inputIcons[i].style.opacity = "0";
		}
		document.getElementById("signupForm").reset();
        console.log('everything went fine');
        // create account
        var accountRef = firebase.database().ref("accounts/" + user.uid);
		accountRef.set({
		  	First_Name: firstName.value,
		    Last_Name: lastName.value,
		    Email: email.value,
		    Proffesion: select.value
		});
        firebase.auth().signOut();
    }).catch(function(error) {
    	document.getElementById("signupProgress").style.display = "none";
    	document.getElementById("errorMessage").style.display = "block";
    	document.getElementById("errorMessage").classList.add("bounceIn");
    	document.getElementById("errorMessage").innerHTML = error.message;
    });
}

function openLogin() {
	$('.signupModal').modal('hide');
	setTimeout(function() {
        $('.loginModal').modal('show');
        document.getElementById("successLoginCont").style.display = "none";
		document.getElementById("successImg").style.display = "none";
    },  500);
}

function openSignup() {
	$('.loginModal').modal('hide');
	setTimeout(function() {
        $('.signupModal').modal('show');
    },  500);
}

function login() {
	
	document.getElementById("loginErrorMessage").style.display = "none";
	document.getElementById("loginErrorMessage").classList.remove("bounceIn");

	var email = document.getElementById("loginEmail");
	var password = document.getElementById("loginPassword");

	document.getElementById("loginEmailError").innerHTML = "";
	document.getElementById("loginEmailError").style.opacity = "0";
	if (email.value === "" || email.value === " ") {
		email.style.border = "1px solid #e57373";
		document.getElementById("loginEmailError").style.opacity = "1";
		document.getElementById("loginEmailError").innerHTML = "Email cant be empty!";
		return;
	}

	regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	OK = regEx.test(email.value);

	if (email.value === "" || email.value === " ") {
		email.style.border = "1px solid #e57373";
		document.getElementById("emailError").style.opacity = "1";
		document.getElementById("emailError").innerHTML = "Email cant be empty!";
		return;
	}

	if (!OK) {
		email.style.border = "1px solid #e57373";
		document.getElementById("loginEmailError").style.opacity = "1";
		document.getElementById("loginEmailError").innerHTML = "Please enter a valid email address!";
		return;
	}
	email.removeAttribute("style");

	document.getElementById("loginPasswordError").innerHTML = "";
	document.getElementById("loginPasswordError").style.opacity = "0";
	if (password.value === "" || password.value === " ") {
		password.style.border = "1px solid #e57373";
		document.getElementById("loginPasswordError").style.opacity = "1";
		document.getElementById("loginPasswordError").innerHTML = "Password cant be empty!";
		return;
	}
	password.removeAttribute("style");

	document.getElementById("loginProgress").style.display = "block";

	// log in
	var promise = firebase.auth().signInWithEmailAndPassword(email.value, password.value).then(function(user) {
		document.getElementById("loginProgress").style.display = "none";
		document.getElementById("successLoginMessage").style.display = "block";
		setTimeout(function() {
        	$('.loginModal').modal('hide');
    	},  2000);
	}).catch(function(error) {
		document.getElementById("loginProgress").style.display = "none";
    	document.getElementById("loginErrorMessage").style.display = "block";
    	document.getElementById("loginErrorMessage").classList.add("bounceIn");
    	document.getElementById("loginErrorMessage").innerHTML = error.message;
	});
}

function forgotPassword() {
	document.getElementById("forgotPasswordMessage").classList.remove("fadeIn");
	var auth = firebase.auth();
	var emailAddress = document.getElementById("loginEmail").value;

	auth.sendPasswordResetEmail(emailAddress).then(function() {
		document.getElementById("forgotPasswordMessage").classList.add("fadeIn");
		document.getElementById("forgotPasswordMessage").style.display = "block";
		document.getElementById("forgotPasswordMessage").classList.remove("alert-danger") + document.getElementById("forgotPasswordMessage").classList.add("alert-success");
		document.getElementById("forgotPasswordMessage").innerHTML = "An email has been sendt to <strong>" + emailAddress + "</strong> containing instructions on how to reset your password!";
		document.getElementById("forgotPassword").style.display = "none";
	  // Email sent.
	}).catch(function(error) {
		document.getElementById("forgotPasswordMessage").classList.add("fadeIn");
		document.getElementById("forgotPasswordMessage").style.display = "block";
		document.getElementById("forgotPasswordMessage").classList.remove("alert-success") + document.getElementById("forgotPasswordMessage").classList.add("alert-danger");
		document.getElementById("forgotPasswordMessage").innerHTML = error.message;
	});
}
