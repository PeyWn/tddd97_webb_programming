/**
 * Serverstub.js
 *
 * Simple dummy server for TDDD97
 *
 * If you're a student, you shouldn't need to look through this file,
 *  the description of how it works is in the lab instructions.
 **/

function transmission(data, token) {
  let str = ``;
  for (let key in data) {
    str += `${key}${data[key]}`;
  }
  const msg = CryptoJS.enc.Utf8.parse(str);
  const secret_key = CryptoJS.enc.Utf8.parse(token);

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

  postMessage(token, sendContent, toEmail = null) {
    const email = window.sessionStorage.getItem("email");
    if (toEmail === null) toEmail = email;
    return this.getRequestPromise(
      "/profile/post",
      [["Email", email]],
      JSON.stringify({
        content: sendContent,
        email: toEmail,
        hmac: ""
      }),
      "PUT"
    );
  }

  getUserDataByToken(token) {
    const email = window.sessionStorage.getItem("email");
    return this.getRequestPromise(
      "/profile/get-by-token",
      [["Email", email]],
      transmission({}, token),
      "GET"
    );
  }

  getUserDataByEmail(token, userEmail = null) {
    const email = window.sessionStorage.getItem("email");
    if (userEmail === null) userEmail = email;
    return this.getRequestPromise(
      "/profile/get-by-email",
      [["Email", email]],
      transmission(
        {
          email: userEmail
        },
        token
      ),
      "POST"
    );
  }

  getUserMessagesByToken(token) {
    const email = window.sessionStorage.getItem("email");
    return this.getRequestPromise(
      "/profile/messages-by-token",
      [["Email", email]],
      transmission({}, token),
      "GET"
    );
  }

  getUserMessagesByEmail(token, fromEmail = null) {
    const email = window.sessionStorage.getItem("email");
    if (fromEmail === null) fromEmail = email;
    return this.getRequestPromise(
      "/profile/messages-by-email",
      [["Email", email]],
      transmission(
        {
          email: fromEmail
        },
        token
      ),
      "POST"
    );
  }

  hasValidSession() {
    const email = window.sessionStorage.getItem("email");
    return this.getRequestPromise(
      "/user/valid-session",
      [["Email", email]],
      "",
      "GET"
    );
  }

  signIn(email, password) {
    return this.getRequestPromise(
      "/user/signin",
      [[]],
      transmission(
        {
          email: email,
          password: password
        },
        "secrets"
      ),
      "POST"
    );
  }

  signOut() {
    const email = window.sessionStorage.getItem("email");
    return this.getRequestPromise(
      "/user/signout",
      [["Email", email]],
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
    const email = window.sessionStorage.getItem("email");
    return this.getRequestPromise(
      "/profile/passchange",
      [["Email", email]],
      transmission(
        {
          oldpassword: oldPassword,
          newpassword: newPassword
        },
        token
      ),
      "PUT"
    );
  }
}

window.communication = new Communication();

//
//   return communication;
// })();
