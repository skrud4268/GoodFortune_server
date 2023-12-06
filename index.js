const express = require("express");
const app = express();

const cors = require("cors");

//require("dotenv").config({ path: "./config.env" });

const port = process.env.PORT || 5050;
app.use(cors());
app.use(express.json());
app.use(require("./routes/routes"));
// Increase the payload limit, e.g., to 50mb
//app.use(express.json({ limit: "50mb" }));
//app.use(express.urlencoded({ limit: "50mb", extended: true }));
// get driver connection
//const dbo = require("./database/conn");

app.listen(port, () => {
  // perform a database connection when server starts
  //dbo.connectToServer();
  console.log(`Server is running on port: ${port}`);
});
