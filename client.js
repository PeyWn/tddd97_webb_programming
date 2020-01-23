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
};
