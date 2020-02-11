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
      if (method !== "POST" && method !== "PUT") {
        return { success: false, message: `${method} in not a valid method` };
      }

      xhttp = new XMLHttpRequest();

      xhttp.open(method, url, true);
      xhttp.setRequestHeader("Content-Type", "application/json");
      console.log("Request ", xhttp);
      console.log("Request method: ", method, typeof method);
      console.log("Request url: ", url, typeof url);
      console.log("Request message: ", message, typeof message);
      xhttp.send(message);
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
      msg = JSON.stringify({
        email: email,
        password: password
      });
      let response = this.getRequestPromise("/user/signin", msg, "POST");
      console.log("Communication response from server: ", response);
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

    signUp: async function(inputObject) {
      // {email, password, firstname, familyname, gender, city, country}
      try {
        let response = await this.getRequestPromise(
          "/user/signup",
          JSON.stringify(inputObject),
          "PUT"
        );
        console.log("Outer response: ", response);
        return response
          ? response
          : {
              success: false,
              message: `No response for server`
            };
      } catch (error) {
        console.log(error);
      }
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
