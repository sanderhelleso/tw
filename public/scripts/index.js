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
}

function signup() {

	var firstName = document.getElementById("firstName");
	var lastName = document.getElementById("lastName");
	var email = document.getElementById("email");
	var select = document.getElementById("signupSelect");
	var password = document.getElementById("password");
	var confirmPass = document.getElementById("confirmPassword");

	// firstname
	document.getElementById("firstNameError").innerHTML = "";
	document.getElementById("firstNameError").style.opacity = "0";
	if (firstName.value === "" || firstName.value === " ") {
		firstName.style.border = "1px solid #ef5350";
		document.getElementById("firstNameError").style.opacity = "1";
		document.getElementById("firstNameError").innerHTML = "First name cant be empty!";
		return;
	}

	if (firstName.value.length < 2) {
		firstName.style.border = "1px solid #ef5350";
		document.getElementById("firstNameError").style.opacity = "1";
		document.getElementById("firstNameError").innerHTML = "First name needs to be atleast 2 characters!";
		return;
	}

	if (firstName.value.length > 40) {
		firstName.style.border = "1px solid #ef5350";
		document.getElementById("firstNameError").style.opacity = "1";
		document.getElementById("firstNameError").innerHTML = "First name cant be longer than 40 characters!";
		return;
	}

	// lastname
	document.getElementById("lastNameError").innerHTML = "";
	document.getElementById("lastNameError").style.opacity = "0";
	if (lastName.value === "" || lastName.value === " ") {
		lastName.style.border = "1px solid #ef5350";
		document.getElementById("lastNameError").style.opacity = "1";
		document.getElementById("lastNameError").innerHTML = "Last name cant be empty!";
		return;
	}

	if (lastName.value.length < 2) {
		lastName.style.border = "1px solid #ef5350";
		document.getElementById("lastNameError").style.opacity = "1";
		document.getElementById("lastNameError").innerHTML = "Last name needs to be atleast 2 characters!";
		return;
	}

	if (lastName.value.length > 40) {
		lastName.style.border = "1px solid #ef5350";
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
		email.style.border = "1px solid #ef5350";
		document.getElementById("emailError").style.opacity = "1";
		document.getElementById("emailError").innerHTML = "Email cant be empty!";
		return;
	}

	if (!OK) {
		email.style.border = "1px solid #ef5350";
		document.getElementById("emailError").style.opacity = "1";
		document.getElementById("emailError").innerHTML = "Please enter a valid email address!";
		return;
	}

	// select
	document.getElementById("selectError").innerHTML = "";
	document.getElementById("selectError").style.opacity = "0";
	if (select.value === select.parentElement.childNodes[3].childNodes[1].value) {
		select.style.border = "1px solid #ef5350";
		document.getElementById("selectError").style.opacity = "1";
		document.getElementById("selectError").innerHTML = "Please select an option from the list!";
		return;
	}

	// password
	document.getElementById("passwordError").innerHTML = "";
	document.getElementById("passwordError").style.opacity = "0";
	if (password.value === "" || password.value === " ") {
		password.style.border = "1px solid #ef5350";
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
		confirmPass.style.border = "1px solid #ef5350";
		document.getElementById("confirmPasswordError").style.opacity = "1";
		document.getElementById("confirmPasswordError").innerHTML = "Confirm password cant be empty!";
		return;
	}

	if (confirmPass.value != password.value) {
		confirmPass.style.border = "1px solid #ef5350";
		document.getElementById("confirmPasswordError").style.opacity = "1";
		document.getElementById("confirmPasswordError").innerHTML = "Passwords dont match!";
		return;
	}
}

// check firstname
function checkName() {

	if (this.value.length >= 2 && this.value.length <= 40) {
		this.style.border = "1px solid #66bb6a";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "1";
	}

	else {
		this.style.border = "1px solid #ef5350";
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
		this.style.border = "1px solid #ef5350";
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
		this.style.border = "1px solid #ef5350";
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
		this.style.border = "1px solid #ef5350";
		this.parentElement.childNodes[1].childNodes[1].style.opacity = "0";
	}

	if (this.value === "") {
		this.removeAttribute("style");
	}
}
