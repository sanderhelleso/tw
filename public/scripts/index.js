window.onload = start;

function start() {

	// load modules
    feather.replace()
    particlesJS.load("particles-js", "/scripts/particles.json", function() {
    	console.log("particles loaded...");
    });
}