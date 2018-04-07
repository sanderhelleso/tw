const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const ejs = require("ejs");
const nodemailer = require("nodemailer");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.engine("handlebars", handlebars({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(`${__dirname}/public`));

// routes
app.get("/", (req, res) => {
	res.render("index");
});

app.get("/dashboard", (req, res) => {
	res.render("dashboard");
});

// get mail data from form
app.post("/dashboard", (req, res) => {
	// mail data
	let mailFrom = req.body.fromAddress;
	let mailTo = req.body.toAddress;
	let mailSubject = req.body.emailSubject;
	let mailContent =  req.body.emailContent;

	console.log(req.body);
	console.log(mailFrom);
	console.log(mailTo);
	console.log(mailSubject);
	console.log(mailContent);

	// smpt setup
	nodemailer.createTestAccount((err, account) => {
	    let transporter = nodemailer.createTransport({
	        host: 'smtp.gmail.com',
	        port: 587,
	        secure: false, 
	        auth: {
	            user: "twappmailer@gmail.com", // secure this later, test acc
	            pass: "twappmailer1"
	        }
	    });

	    // setup email data
	    let mailOptions = {
	        from: mailFrom, 
	        to: mailTo,
	        subject: mailSubject,
	        text: mailContent
	    };

	    // send mail with defined transport object
	    transporter.sendMail(mailOptions, (error, info) => {
	        if (error) {
	            return console.log(error);
	        }

	        // mail sendt
	        console.log('Message sent: %s', info.messageId);
	    });
	});
});


server.listen(port, () => {
	console.log(`Server started on ${port}`);
});