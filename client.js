function validateSignUp(event) {
  event.preventDefault();
  let fields = event.target.elements;
  let msg = "";

  if (fields.Password.value.length <= minLenPass) {
    const _msg = `Passwords is to short need to be at least ${minLenPass}`;
    console.warn(_msg);
    document.getElementById("LV-Form-Message").innerText = `${_msg} \n`;
    return;
  }

  if (fields.Password.value !== fields.Password2.value) {
    const _msg = "Passwords do not match";
    console.warn(_msg);
    document.getElementById("LV-Form-Message").innerText = _`${_msg} \n`;
    return;
  }
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
