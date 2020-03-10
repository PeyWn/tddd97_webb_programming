/* ======= Render Page ======= */

function flushPage() {
  for (view in views) {
    if (view !== "login") {
      let bodyElem = getElement(views[view].body);
      if (bodyElem !== false) {
        bodyElem.innerHTML = null;
      }
    }
  }
  for (layout in layouts) {
    let layoutBody = getElement(layouts[layout].body);
    if (layoutBody !== false) {
      layoutBody.innerHTML = null;
    }
  }
}

/** Profile view (Home page) and browse view
 * Updates wall messages for profile page and browse page
 */
async function renderUserMessages(email = false) {
  let response;
  if (email === false) {
    response = await getCurrentUserMessages();
  } else {
    response = await getUserMessages(email);
  }

  if (response)
    insertMessagesTo(email === false ? "pv-wall" : "bv-wall", response);
}

/**
 *  Renders all pages on login, fetching data from backend
 */
function renderPage() {
  for (view in views) {
    let bodyElem = getElement(views[view].body);
    const headElem = getElement(views[view].head);
    if (bodyElem === false || headElem === false) return;

    bodyElem.innerHTML = headElem.innerHTML;
    bodyElem.style.display === "none";

    switch (view) {
      case "profile":
        loadProfileInfo();
        renderUserMessages();
        break;
    }
  }
  for (layout in layouts) {
    let layoutBody = getElement(layouts[layout].body);
    const layoutHead = getElement(layouts[layout].head);
    if (layoutBody === false || layoutHead === false) return;
    layoutBody.innerHTML = layoutHead.innerHTML;
    layoutBody.style.display = "block";
  }
}

/* ======= End ======= */

/* ======= Crypto Helpers ======= */

async function genKeys() {
  if ("crypto" in window) {
    window.crypto.subtle
      .generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048, //can be 1024, 2048, or 4096
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: "SHA-256" } //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
      )
      .then(function(keyPair) {
        //returns a keypair object
        console.log(keyPair);
        console.log(keyPair.publicKey);
        console.log(keyPair.privateKey);
        window.sessionStorage.setItem("KEYS", keyPair);
      })
      .catch(function(err) {
        console.error(err);
      });
  }
}

/* ======= End ======= */

/* ======= General Helpers ======= */

function session() {
  // TODO refresh
  if ("WebSocket" in window) {
    const port = "5000";
    const route = "/api/session";
    const email = getSessionItem("email");
    let wsProc = "ws";
    if (location.protocol !== "https:") {
      wsProc = "wss";
    }

    ws = new WebSocket(`${wsProc}://${document.domain}:${port}${route}`);

    ws.onopen = function() {
      const msg = JSON.stringify({
        Email: email
      });
      ws.send(msg);
    };
    ws.onclose = function() {
      console.log("Signing-out");
      signOut();
    };
  } else {
    console.warn("Web not supported");
  }
  return;
}

/**
 * Helper function fetching element and performing error check
 * id : Id of the element to fetch
 */
function getElement(id) {
  if (document === null || typeof document === "undefined") {
    console.error("Not a valid session");
    return false;
  }
  const elem = document.getElementById(id);

  if (elem === null || typeof elem === "undefined") {
    console.warn(`Element ${id} not found`);
    return false;
  }

  return elem;
}

/**
 * Helper function fetching session storage by id and performing
 * error checks.
 * id: The id of the session item to fetch
 */
function getSessionItem(id) {
  if (window === null || typeof window === "undefined") {
    console.error("Not a valid session");
    return false;
  }

  const item = window.sessionStorage.getItem(id);
  if (item === null || typeof item === "undefined" || item === "") {
    return false;
  }

  return item;
}

/**
 * Checks if the current session has a valid token
 */
async function hasValidSession() {
  const email = getSessionItem("email");
  if (email === false) return false;
  const response = await communication.hasValidSession(email);
  if (!("success" in response)) return false;
  return response.success;
}

/**
 * Writes a message to a element, used for writing error
 * messages to empty divs
 */
function writeToElement(msg, id) {
  let errorElem = getElement(id);
  if (errorElem === false) return;

  errorElem.innerHTML = `${msg} \n`;
}

/**
 * Inserts Messages to DOM element inner html
 * @param {DOM elem id} id
 * @param {Array of Messages} messages {writer: String, content: String}
 */
async function insertMessagesTo(id, messages) {
  let infoElem = getElement(id);
  if (infoElem === false) return;
  infoElem.innerHTML = null;
  messages = messages.reverse();
  messages.forEach(msg => {
    infoElem.innerHTML += `
      <div class='Msg'>
        <p>${msg.content}</p>
        <h3>${msg.writer}</h3>
      </div>
      `;
  });
}

/* ======= End ======= */

/* ======= Login View ======= */

/**
 *Validates login by checking password validity and fetching token from
 *backend. If login succeeds, calls renderpage to render all pages and
 *redirect to profile view
 */
async function validateLogin(event) {
  event.preventDefault();
  let fields = event.target.elements;
  const minLenPass = 3;

  const msgId = "LV-Login-Form-Message";

  if (fields.password.value.length <= minLenPass) {
    const _msg = `Passwords is to short need to be at least ${minLenPass}`;
    console.warn(_msg);

    writeToElement(_msg, msgId);
    return;
  }

  window.sessionStorage.setItem("email", fields.username.value);

  const response = await communication.signIn(
    fields.username.value,
    fields.password.value
  );

  let _msg = "";
  if (response.success === true && "data" in response) {
    window.sessionStorage.setItem("token", response.data);

    this.session();

    _msg = `Successfully logged in`;

    renderPage();
    changeView("profile");
  } else {
    _msg = `Failed to log in`;
    console.warn(_msg);
  }
  writeToElement(_msg, msgId);
}

function validatePassLength(password) {
  const minLenPass = 3;

  return password.length > minLenPass;
}

async function validateSignUp(event) {
  event.preventDefault();
  let fields = event.target.elements;

  const msgId = "LV-SignUp-Form-Message";

  if (validatePassLength(fields.password.value) === false) {
    const _msg = `Passwords is to short`;
    console.warn(_msg);
    writeToElement(_msg, msgId);
    return;
  }

  if (fields.password.value !== fields.password2.value) {
    const _msg = "Passwords do not match";
    console.warn(_msg);

    writeToElement(_msg, msgId);
    return;
  }
  const postMsg = {
    email: fields.email.value,
    password: fields.password.value,
    firstname: fields.firstname.value,
    familyname: fields.familyname.value,
    gender: fields.gender.value,
    city: fields.city.value,
    country: fields.country.value
  };

  let response = await communication.signUp(postMsg);

  writeToElement(response.data, msgId);
}

/* ======= End ======= */

/* ======= Account View ======= */

async function changePassword(event) {
  event.preventDefault();

  let fields = event.target.elements;
  const msgId = "AV-change-Form-Message";

  if (validatePassLength(fields.newPassword.value) === false) {
    const _msg = `New passwords is to short`;
    console.warn(_msg);

    writeToElement(_msg, msgId);
    return;
  }

  if (fields.newPassword.value !== fields.newPassword2.value) {
    const _msg = "Passwords do not match";
    console.warn(_msg);

    writeToElement(_msg, msgId);
    return;
  }

  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") {
    console.warn("Token not found when changing password");
    return;
  }

  const serverMsg = await communication.changePassword(
    token,
    fields.oldPassword.value,
    fields.newPassword.value
  );

  writeToElement(serverMsg.data, msgId);
}

async function signOut(event) {
  event && event.preventDefault();

  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") {
    console.warn("Token not found when signing out");
    return;
  }
  await communication.signOut();
  flushPage();
  window.sessionStorage.setItem("token", null);
  changeView("login");
  window.sessionStorage.setItem("token", "");
}

/* ======= End ======= */

/* ======= Browse View ======= */

async function loadProfileByEmail(email) {
  let infoElem = getElement("bv-info");
  if (infoElem === false) return;
  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") return;
  const response = await communication.getUserDataByEmail(token, email);
  let success = response.success;
  let data = response.data;
  if (success) {
    infoElem.innerHTML = `
    <h3>Email: ${data.email}</h3>
    <h3>Firstname: ${data.firstname}</h3>
    <h3>Familyname: ${data.familyname}</h3>
    <h3>Gender: ${data.gender}</h3>
    <h3>City: ${data.city}</h3>
    <h3>Country: ${data.country}</h3>
    `;
  }
}

async function getUserMessages(email) {
  const token = getSessionItem("token");
  if (token === false) return false;
  const response = await communication.getUserMessagesByEmail(token, email);
  return response.success ? response.data : false;
}

/** Browse Tab
 * Loads a profile from backend and displays it on the browse tab
 * @param {*} event
 */
async function renderProfileByEmail(event) {
  event.preventDefault();

  let fields = event.target.elements;

  const msgId = "BV-load-profile-form-message";

  writeToElement("", msgId);

  if (fields.email === "" || typeof fields.email === "undefined") {
    const _msg = "Cant submit an empty field";
    writeToElement(_msg, msgId);
    return;
  }

  let response = await getUserMessages(fields.email.value);
  if (response === false) {
    const _msg = "There is no user with that email";
    writeToElement(_msg, msgId);
    return;
  }

  const formMsg = "bv-submit-msg";
  const form = `
    <form
			name="FeedForm"
			required
			onsubmit="postToFeed(event,  '${formMsg}', '${fields.email.value}'); this.reset(); return false;">

				<p>Enter post:</p>
        <textarea name="feedInput" required></textarea>
        <div>
            <button class="BtnPost" type="submit">Submit</button>
            <button onclick="refreshWall(event)"; return false'>Refresh</button>
        </div>
			  <p id=${formMsg}></p>
    </form>
      `;
  loadProfileByEmail(fields.email.value);
  writeToElement(form, "bv-post");
  insertMessagesTo("bv-wall", response);
}

/* ======= End ======= */

/* ======= Home-view ======= */

function refreshWall(event) {
  event.preventDefault();

  const view = getSessionItem("CURRENT_VIEW");
  if (view !== false && view === "profile") {
    renderUserMessages();
    return;
  }
  const item = getSessionItem("bv-user-email");
  if (item !== false) renderUserMessages(item);
}

async function loadProfileInfo() {
  let infoElem = getElement("pv-info");
  if (infoElem === false) return;
  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") return;
  const response = await communication.getUserDataByEmail(token);
  let success = response.success;
  let data = response.data;
  if (success) {
    infoElem.innerHTML = `
    <h3>Email: ${data.email}</h3>
    <h3>Firstname: ${data.firstname}</h3>
    <h3>Familyname: ${data.familyname}</h3>
    <h3>Gender: ${data.gender}</h3>
    <h3>City: ${data.city}</h3>
    <h3>Country: ${data.country}</h3>
    `;
  }
}

async function getCurrentUserMessages() {
  const token = getSessionItem("token");
  if (token === false) return false;
  const response = await communication.getUserMessagesByEmail(token);
  return response.success ? response.data : false;
}

async function postToFeed(event, msgId, userEmail = false) {
  event.preventDefault();

  let fields = event.target.elements;
  if (
    fields.feedInput === "" ||
    typeof fields.feedInput === "undefined" ||
    !("value" in fields.feedInput)
  ) {
    console.log("Failed to post due to form error");
    return;
  }
  const content = fields.feedInput.value;

  const token = getSessionItem("token");
  if (!token) {
    const _msg = "Token not found when posting on wall";
    writeToElement(_msg, msgId);
    return;
  }

  if (userEmail !== false) {
    const storageId = "bv-user-email";
    window.sessionStorage.setItem(storageId, userEmail);
  }

  let response;
  if (userEmail === false) {
    response = await communication.getUserDataByEmail(token);
  } else {
    response = await communication.getUserDataByEmail(token, userEmail);
  }

  if (
    typeof response === "undefined" ||
    !("data" in response) ||
    !("email" in response.data) ||
    response.data.email === "" ||
    typeof response.data.email === "undefined"
  ) {
    const _msg =
      "data" in response
        ? response.data
        : "User not found when posting on wall";
    writeToElement(_msg, msgId);
    return;
  }
  email = response.data.email;
  await communication.postMessage(token, content, email);

  renderUserMessages(userEmail !== false && userEmail);
}

/* ======= End ======= */
/**
 * Sets the Active class to a element and remove it from all others
 * Called from displayView() function
 * @param {DOM elem id} elem
 */
function toggleActive(elem) {
  if (elem.classList.contains("Active")) return;
  let actives = document.getElementsByClassName("Active");
  for (i = 0; i < actives.length; i++) {
    actives[i].classList.remove("Active");
  }
  elem.classList.add("Active");
}

/**
 * A object containing all views.
 * Each view has the id for:
 *  1. Where to load from head
 *  2. Where to insert in body
 *  3. Navigation bar link
 */
const views = {
  login: { head: "load-login-view", body: "login-view", navLink: "" },
  profile: {
    head: "load-profile-view",
    body: "profile-view",
    navLink: "nav-profile"
  },
  browse: {
    head: "load-browse-view",
    body: "browse-view",
    navLink: "nav-browse"
  },
  account: {
    head: "load-account-view",
    body: "account-view",
    navLink: "nav-account"
  }
};
const layouts = {
  layoutNavBar: { head: "load-layout-navbar", body: "layout-navbar" }
};

/**
 * Abstraction for displayView()
 * If there is a valid view input, change view
 * otherwise do nothing
 */
function changeView(viewName) {
  if (viewName in views) {
    const currentView = getSessionItem("CURRENT_VIEW");
    let elem = false;
    if (currentView === false) {
      elem = getElement(views["login"].body);
    } else {
      elem = getElement(views[currentView].body);
    }
    if (elem === false) return;
    elem.style.display = "none";
    window.sessionStorage.setItem("CURRENT_VIEW", viewName);
    displayView();
  } else console.error("Can't change view, not found wrong input");
}

/**
 * displays a view
 * The id for the script tag that stores the HTML for the view
 * is accessed from session storage with the 'CURRENT_VIEW' key
 */
displayView = function() {
  if (window === null || typeof window === "undefined") return;

  const currentView = getSessionItem("CURRENT_VIEW");
  /**
   * If there is no value stored for the 'CURRENT_VIEW', change to welcome welcome view
   * otherwise change to that the view stored
   */
  if (currentView === false || currentView === "" || currentView === "login") {
    let loginBodyElem = getElement(views["login"].body);
    const loginHeadElem = getElement(views["login"].head);
    if (loginBodyElem === false || loginHeadElem === false) return;
    loginBodyElem.innerHTML = loginHeadElem.innerHTML;
    loginBodyElem.style.display = "block";
    return;
  }
  let elem = getElement(views[currentView].body);
  if (elem === false) return;
  elem.style.display = "block";
  const linkElem = getElement(views[currentView].navLink);
  if (linkElem !== false) toggleActive(linkElem);
};

window.onload = async function() {
  let isValid = await this.hasValidSession();
  if (isValid) {
    this.session();
    this.renderPage();
  } else {
    this.signOut();
  }
  this.displayView();
};
