/**
 * Serverstub.js
 *
 * Simple dummy server for TDDD97
 *
 * If you're a student, you shouldn't need to look through this file,
 *  the description of how it works is in the lab instructions.
 **/

// function transmission(data) {
//   const email = window.sessionStorage.getItem("email");
//   const hmac = hmacSHA512(JSON.stringify(data), email);
//   data.push({
//     key: "hmac",
//     value: hmac
//   });
//   return JSON.stringify(data);
// }
// import hmacSHA512 from "crypto-js/hmac-sha512";

// var communication = (function() {
//   var communication = {
function transmission(data) {
  const email = window.sessionStorage.getItem("email");
  const str   = JSON.stringify(data)

  const msg = CryptoJS.enc.Utf8.parse(str)
  const secret_key = CryptoJS.enc.Utf8.parse(email)

  const hmac = CryptoJS.HmacSHA512(msg, secret_key);
  data["hmac"] = CryptoJS.enc.Hex.stringify(hmac);
  return JSON.stringify(data);
}

class Communication {
  constructor() {}

  getRequestPromise(url = "/wrong", head = [], body = "", method = "PUT") {
    if (method !== "POST" && method !== "PUT" && method !== "GET") {
      return { success: false, body: `${method} in not a valid method` };
    }

    let xhttp = new XMLHttpRequest();

    xhttp.open(method, url, true);
    xhttp.setRequestHeader("Content-Type", "application/JSON");

    head.forEach(h => {
      xhttp.setRequestHeader(h[0], h[1]);
    });

    //console.log("Request method: ", method, typeof method);
    //console.log("Request url: ", url, typeof url);
    //console.log("Request body: ", body, typeof body);
    xhttp.send(body);
    //console.log("Request sent ", xhttp);

    return new Promise(function(resolve, reject) {
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          // console.log("Ready to resolve ", this.responseText);
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
  }

  postMessage(token, sendContent, toEmail) {
    return this.getRequestPromise(
      "/profile/post",
      [["Token", token]],
      transmission({
        content: sendContent,
        email: toEmail
      }),
      "PUT"
    );
  }

  getUserDataByToken(token) {
    return this.getRequestPromise(
      "/profile/get-by-token",
      [["Token", token]],
      transmission({}),
      "GET"
    );
  }

  getUserDataByEmail(token, userEmail) {
    return this.getRequestPromise(
      "/profile/get-by-email",
      [["Token", token]],
      transmission({
        email: userEmail
      }),
      "POST"
    );
  }

  getUserMessagesByToken(token) {
    return this.getRequestPromise(
      "/profile/messages-by-token",
      [["Token", token]],
      transmission({}),
      "GET"
    );
  }

  getUserMessagesByEmail(token, fromEmail) {
    return this.getRequestPromise(
      "/profile/messages-by-email",
      [["Token", token]],
      transmission({
        email: fromEmail
      }),
      "POST"
    );
  }

  hasValidSession(token) {
    return this.getRequestPromise(
      "/user/valid-session",
      [["Token", token]],
      "",
      "GET"
    );
  }

  signIn(email, password) {
    return this.getRequestPromise(
      "/user/signin",
      [[]],
      transmission({
        email: email,
        password: password
      }),
      "POST"
    );
  }

  signOut(token) {
    return this.getRequestPromise(
      "/user/signout",
      [["Token", token]],
      "",
      "PUT"
    );
  }

  signUp(inputObject) {
    // {email, password, firstname, familyname, gender, city, country}
    return this.getRequestPromise(
      "/user/signup",
      [[]],
      transmission(inputObject),
      "PUT"
    );
  }

  changePassword(token, oldPassword, newPassword) {
    return this.getRequestPromise(
      "/profile/passchange",
      [["Token", token]],
      transmission({
        oldpassword: oldPassword,
        newpassword: newPassword
      }),
      "PUT"
    );
  }
}

window.communication = new Communication();

//
//   return communication;
// })();
