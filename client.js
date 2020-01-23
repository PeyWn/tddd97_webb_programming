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

displayView = function() {
  // the code required to display a view
};
window.onload = function() {
  //code that is executed as the page is loaded.
  //You shall put your own custom code here.
  //window.alert() is not allowed to be used in your implementation.
  //window.alert("Hello TDDD97!");
  let view = this.document.getElementById("load-welcome-view").innerHTML;
  let mainView = this.document.getElementById("main-view");
  mainView.innerHTML = view;
  //   this.document.getElementById("SignUpForm").onsubmit() = this.validateSignUp;
};
