/**
 * Serverstub.js
 *
 * Simple dummy server for TDDD97
 *
 * If you're a student, you shouldn't need to look through this file,
 *  the description of how it works is in the lab instructions.
 **/

var communication = (function() {
    var communication = {
	getRequestPromise: function(url = "/wrong", head = [], body = "", method = "PUT") {
	    if (method !== "POST" && method !== "PUT" && method !== "GET") {
		return { success: false, body: `${method} in not a valid method` };
	    }

	    xhttp = new XMLHttpRequest();

	    xhttp.open(method, url, true);
	    xhttp.setRequestHeader("Content-Type", "application/json");

	    for h in head {
		xhttp.setRequestHeader(h[0], h[1]);
	    }
	    
	    console.log("Request method: ", method, typeof method);
	    console.log("Request url: ", url, typeof url);
	    console.log("Request body: ", body, typeof body);
	    xhttp.send(body);
	    console.log("Request sent ", xhttp);	  

	    return new Promise(function(resolve, reject) {
		xhttp.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200) {
			console.log("Ready to resolve ", this.responseText);
			try {
			    resolve(JSON.parse(this.responseText));
			} catch (error) {
			    reject({
				success: false,
				message: `Something went wrong: ${error ? error : "error..."}`
			    });
			}
		    }
		};
	    });
	},

	postMessage: function(token, content, toEmail) {
	    return;
	},

	getUserDataByToken: function(token) {
	    return;
	},

	getUserDataByEmail: function(token, email) {
	    return;
	},

	getUserMessagesByToken: function(token) {
	    return;
	},

	getUserMessagesByEmail: function(token, email) {
	    return;
	},

	signIn: function(email, password) {
	    return this.getRequestPromise(
		"/user/signin",
		[],
		JSON.stringify({
		    email: email,
		    password: password
		}),
		"POST"
	    );
	},

	signOut: function(token) {
	    return;
	},

	signUp: function(inputObject) {
	    // {email, password, firstname, familyname, gender, city, country}
            return this.getRequestPromise(
		"/user/signup",
		[],
		JSON.stringify(inputObject),
		"PUT"
            );
	},

	changePassword: function(token, oldPassword, newPassword) {
	    return this.getRequestPromise(
		"/user/signup",
		['Token', token],
		JSON.stringify({
		    oldpassword: oldPassword,
		    newpassword: newPassword
		}),
		"PUT"
	    );	   
	}
    };

    return communication;
})();
