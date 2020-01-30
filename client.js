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

function toggleActive(elem) {
  if (elem.classList.contains("Active")) return;
  let actives = document.getElementsByClassName("Active");
  for (i = 0; i < actives.length; i++) {
    actives[i].classList.remove("Active");
  }
  elem.classList.add("Active");
}

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

function renderProfileByEmail(event) {
  event.preventDefault();

  let fields = event.target.elements;

  const msgId = "BV-load-profile-form-message";

  writeToElement("", msgId);

  if (fields.email === "" || typeof fields.email === "undefined") {
    const _msg = "Cant submit an empty field";
    writeToElement(_msg, msgId);
    return;
  }

  const messages = getUserMessages(fields.email.value);

  if (messages === false || typeof messages === "undefined") {
    const _msg = "Could not find a user by that address";
    writeToElement(_msg, msgId);
    return;
  }

  loadProfileByEmail(fields.email.value);
  insertWallMessagesTo("bv-wall", messages);
}

function renderUserMessages() {
  const data = getCurrentUserMessages();
  if (data) insertWallMessagesTo("pv-wall", data);
}

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

function hasValidToken() {
  const token = getSessionItem("token");
  if (token === false) return false;
  return true;
}

function validateLogin(event) {
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

  const token = serverstub.signIn(fields.username.value, fields.password.value);

  if (token.success === true && "data" in token) {
    window.sessionStorage.setItem("token", token.data);
    const _msg = `Successfully logged in`;

    writeToElement(_msg, msgId);
    renderPage();
    changeView("profile");
  } else {
    const _msg = `Failed to log in`;
    console.warn(_msg);

    writeToElement(_msg, msgId);
  }
}

function writeToElement(msg, id) {
  let errorElem = getElement(id);
  if (errorElem === false) return;

  errorElem.innerText = `${msg} \n`;
}

function validatePassLength(password) {
  const minLenPass = 3;

  return password.length > minLenPass;
}

function validateSignUp(event) {
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

  writeToElement(serverstub.signUp(postMsg).message, msgId);
}

function changePassword(event) {
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

  const serverMsg = serverstub.changePassword(
    token,
    fields.oldPassword.value,
    fields.newPassword.value
  ).message;

  writeToElement(serverMsg, msgId);
}

function signOut(event) {
  event.preventDefault();

  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") {
    console.warn("Token not found when signing out");
    return;
  }
  serverstub.signOut(token);
  flushPage();
  changeView("login");

  window.sessionStorage.setItem("token", "");
}

function loadProfileByEmail(email) {
  let infoElem = getElement("bv-info");
  if (infoElem === false) return;
  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") return;
  const { success, data } = serverstub.getUserDataByEmail(token, email);
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

/* ======= Home-view js lib  ======= */

function loadProfileInfo() {
  let infoElem = getElement("pv-info");
  if (infoElem === false) return;
  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") return;
  const { success, data } = serverstub.getUserDataByToken(token);
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

function getUserMessages(email) {
  const token = getSessionItem("token");
  if (token === false) return false;
  const { success, data } = serverstub.getUserMessagesByEmail(token, email);
  if (!success) return false;
  return data;
}

function getCurrentUserMessages() {
  const token = getSessionItem("token");
  if (token === false) return false;
  const { success, data } = serverstub.getUserMessagesByToken(token);
  if (!success) return false;
  return data;
}

function insertWallMessagesTo(id, messages) {
  let infoElem = getElement(id);
  if (infoElem === false) return;
  infoElem.innerHTML = null;
  messages.forEach(msg => {
    infoElem.innerHTML += `
      <div class='Msg'>
        <p>${msg.content}</p>
        <h3>${msg.writer}</h3>
      </div>
      `;
  });
}

function postToFeed(event) {
  event.preventDefault();

  const msgId = "PV-Submit-msg";

  let fields = event.target.elements;
  if (
    fields.feedInput === "" ||
    typeof fields.feedInput === "undefined" ||
    !("value" in fields.feedInput)
  )
    return;

  const token = getSessionItem("token");
  if (!token) {
    const _msg = "Token not found when posting on wall";
    writeToElement(_msg, msgId);
    return;
  }

  const {
    data: { email }
  } = serverstub.getUserDataByToken(token);

  if ((email === "") | (typeof email === "undefined")) {
    const _msg = "User not found when posting on wall";
    writeToElement(_msg, msgId);
    return;
  }

  const obj = serverstub.postMessage(token, fields.feedInput.value, email);
  console.log(obj);
  renderUserMessages();
}

/* ======= Home-view the end ======= */

/**
 * Abstraction for change view
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

window.onload = function() {
  if (this.hasValidToken()) {
    this.renderPage();
  }
  this.displayView();
};
