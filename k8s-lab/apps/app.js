const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello K8s 🚀");
});

app.listen(3000, () => console.log("Running"));
