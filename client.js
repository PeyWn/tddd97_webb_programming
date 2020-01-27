function validateLogin(event) {
  event.preventDefault();
  let fields = event.target.elements;
  const minLenPass = 4;

  if (fields.password.value.length <= minLenPass) {
    const _msg = `Passwords is to short need to be at least ${minLenPass}`;
    console.warn(_msg);
    document.getElementById("LV-Login-Form-Message").innerText = `${_msg} \n`;
    return;
  }
  const token = serverstub.signIn(fields.username.value, fields.password.value);
  if (token.success === true && "data" in token) {
    window.sessionStorage.setItem("token", token.data);
    const _msg = `Successfully logged in`;
    document.getElementById("LV-Login-Form-Message").innerText = `${_msg} \n`;
    renderPage();
    changeView("profile");
  } else {
    const _msg = `Failed to log in`;
    console.warn(_msg);
    document.getElementById("LV-Login-Form-Message").innerText = `${_msg} \n`;
  }
}

function hasValidToken() {
  const token = window.sessionStorage.getItem("token");
  if (token === null || typeof token === "undefined") return;
  return true;
}

function validateSignUp(event) {
  event.preventDefault();
  let fields = event.target.elements;
  const minLenPass = 1;
  let errorElem = document.getElementById("LV-SignUp-Form-Message");

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

const views = {
  login: { head: "load-login-view", body: "login-view" },
  profile: { head: "load-profile-view", body: "profile-view" },
  browse: { head: "load-browse-view", body: "browse-view" },
  account: { head: "load-account-view", body: "account-view" }
};

function renderPage() {
  for (view in views) {
    if (view !== "login") {
      this.document.getElementById(
        views[view].body
      ).innerHTML = this.document.getElementById(views[view].head).innerHTML;
    }
  }
}

/**
 * Abstraction for change view
 * If there is a valid view input, change view
 * otherwise do nothing
 */
function changeView(viewName) {
  if (viewName in views) {
    const currentView = window.sessionStorage.getItem("CURRENT_VIEW");
    if (currentView === null || typeof currentView === "undefined") {
      this.document.getElementById(views["login"].body).style.display = "none";
      return;
    }
    this.document.getElementById(currentView).style.display = "none";

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

  const currentView = window.sessionStorage.getItem("CURRENT_VIEW");
  /**
   * If there is no value stored for the 'CURRENT_VIEW', change to welcome welcome view
   * otherwise change to that the view stored
   */
  if (currentView === null || typeof currentView === "undefined") {
    this.document.getElementById(
      "login-view"
    ).innerHTML = this.document.getElementById("load-login-view").innerHTML;
    return;
  }
  this.document.getElementById(currentView).style.display = "block";
};

window.onload = function() {
  this.displayView();
  if (this.hasValidToken()) this.renderPage();

  //   let view = this.document.getElementById("load-welcome-view").innerHTML;
  //   let mainView = this.document.getElementById("main-view");
  //   mainView.innerHTML = view;
  //   this.document.getElementById("SignUpForm").onsubmit() = this.validateSignUp;
};
