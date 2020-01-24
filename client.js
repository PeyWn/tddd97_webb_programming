function validateLogin(event) {
  event.preventDefault();
  let fields = event.target.elements;
  const minLenPass = 4;
  console.log(fields);
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
    changeView("profile");
  } else {
    const _msg = `Failed to log in`;
    console.warn(_msg);
    document.getElementById("LV-Login-Form-Message").innerText = `${_msg} \n`;
  }
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

/**
 * Abstraction for change view
 * If there is a valid view input, change view
 * otherwise do nothing
 */
changeView = function(view) {
  const views = {
    welcome: "load-welcome-view",
    profile: "load-profile-view"
  };
  if (view in views) {
    window.sessionStorage.setItem("CURRENT_VIEW", views[view]);
    displayView();
  } else console.error("Can't change view, not found wrong input");
};

/**
 * displays a view
 * The id for the script tag that stores the HTML for the view
 * is accessed from session storage with the 'CURRENT_VIEW' key
 */
displayView = function() {
  let mainView = this.document.getElementById("main-view");
  if (window === null || typeof window === "undefined") return;

  const currentView = window.sessionStorage.getItem("CURRENT_VIEW");
  /**
   * If there is no value stored for the 'CURRENT_VIEW', change to welcome welcome view
   * otherwise change to that the view stored
   */
  if (currentView === null || typeof currentView === "undefined") {
    mainView.innerHTML = this.document.getElementById(
      "load-welcome-view"
    ).innerHTML;
    return;
  }
  mainView.innerHTML = this.document.getElementById(currentView).innerHTML;
};
window.onload = function() {
  displayView();
  //   let view = this.document.getElementById("load-welcome-view").innerHTML;
  //   let mainView = this.document.getElementById("main-view");
  //   mainView.innerHTML = view;
  //   this.document.getElementById("SignUpForm").onsubmit() = this.validateSignUp;
};
