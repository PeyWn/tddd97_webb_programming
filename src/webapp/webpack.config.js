const path = require("path");

module.exports = {
  entry: "./static/client.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "static")
  }
};
