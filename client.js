const views = {
  login: { head: "load-login-view", body: "login-view" },
  profile: { head: "load-profile-view", body: "profile-view" },
  browse: { head: "load-browse-view", body: "browse-view" },
  account: { head: "load-account-view", body: "account-view" }
};

function renderPage() {
  for (view in views) {
    if (view !== "login") {
      let bodyElem = getElement(views[view].body);
      const headElem = getElement(views[view].head);
      if (bodyElem === false || headElem === false) return;
      bodyElem.innerHTML = headElem.innerHTML;
      bodyElem.style.display === "none";
    }
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
  if (item === null || typeof item === "undefined") {
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
  const minLenPass = 4;

  if (fields.password.value.length <= minLenPass) {
    const _msg = `Passwords is to short need to be at least ${minLenPass}`;
    console.warn(_msg);
    let elem = getElement("LV-Login-Form-Message");
    if (elem === false) return;
    elem.innerText = `${_msg} \n`;
    return;
  }
  const token = serverstub.signIn(fields.username.value, fields.password.value);
  if (token.success === true && "data" in token) {
    window.sessionStorage.setItem("token", token.data);
    const _msg = `Successfully logged in`;
    let elem = getElement("LV-Login-Form-Message");
    if (elem === false) return;
    elem.innerText = `${_msg} \n`;
    renderPage();
    changeView("profile");
  } else {
    const _msg = `Failed to log in`;
    console.warn(_msg);
    let elem = getElement("LV-Login-Form-Message");
    if (elem === false) return;
    elem.innerText = `${_msg} \n`;
  }
}

function validateSignUp(event) {
  event.preventDefault();
  let fields = event.target.elements;
  const minLenPass = 1;
  let errorElem = getElement("LV-SignUp-Form-Message");
  if (errorElem === false) return;

  if (fields.password.value.length < minLenPass) {
    const _msg = `Passwords is to short need to be at least ${minLenPass}`;
    console.warn(_msg);
    errorElem.innerText = `${_msg} \n`;
    return;
  }

  if (fields.password.value !== fields.password2.value) {
    const _msg = "Passwords do not match";
    console.warn(_msg);
    errorElem.innerText = `${_msg} \n`;
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

  errorElem.innerText = serverstub.signUp(postMsg).message;
}

/**
 * Abstraction for change view
 * If there is a valid view input, change view
 * otherwise do nothing
 */
function changeView(viewName) {
  if (viewName in views) {
    const currentView = getSessionItem("CURRENT_VIEW");
    console.log(`change view from ${currentView} to  ${viewName}`);
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
  if (currentView === false) {
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
};

window.onload = function() {
  this.displayView();
  if (this.hasValidToken()) this.renderPage();
};
