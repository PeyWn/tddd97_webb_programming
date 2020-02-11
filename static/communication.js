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
    getRequestPromise: function(url = "/wrong", message = "", method = "PUT") {
      if (method !== "GET" && method !== "PUT") {
        return { success: false, message: `${method} in not a valid method` };
      }

      xhttp = new XMLHttpRequest();

      console.log("Open Request");
      xhttp.open(method, url, true);
	  console.log("Opened Request");
	  xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.send(message);
      console.log("Sent Request");

      return new Promise(function(resolve, reject) {
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            try {
              resolve(JSON.parse(this.responseText));
            } catch (error) {
              reject({
                success: false,
                message: `Something went wrong: ${error ? error : "error..."}`
              });
            }
          } else {
            reject({
              success: false,
              message: `Promise rejected`
            });
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

    signIn: async function(email, password) {
      msg = JSON.stringify({
        email: email,
        password: password
      });
      let response = await this.getRequestPromise(
        "http://127.0.0.1:5000/user/signin",
        msg,
        "GET"
      );
      console.log("Outer response: ", response);
      return response
        ? response
        : {
            success: false,
            message: `No response for server`
          };
    },

    signOut: function(token) {
      return;
    },

    signUp: function(inputObject) {
      // {email, password, firstname, familyname, gender, city, country}
      return;
    },

    changePassword: function(token, oldPassword, newPassword) {
      msg = json.dumps({
        token: token,
        oldpassword: oldPassword,
        newpassword: newPassword
      });
      return;
    }
  };

  return communication;
})();
