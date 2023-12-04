const express = require("express");
const session = require("express-session");
const bcrypt = require('bcrypt');
const { ObjectId } = require("mongodb");
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit of 50MB
});

// The router will be added as a middleware and will take control of requests starting with path /record.
const appRouter = express.Router();

//var session;

const dbo = require("../database/conn");
dbo.connectToServer();

appRouter
    .route("/register")
    .post(async function (req, response) {
        let db_connect = dbo.getDb();
        let newUser = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            confirmEmail: req.body.confirmEmail,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
    };
 console.log(newUser);
 const results = await db_connect.collection("user_account").insertOne(newUser);
 response.json(results);
});

appRouter
  .route("/login")
  .post(async function (req, res) {
    let db_connect = dbo.getDb();
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(400).send("Email and password is required");
      }
  
       let loginCredentials= {
        email: req.body.email,
        password: req.body.password,
      };
    
      var email = { email: loginCredentials.email };
      const user = await db_connect.collection("user_account").find(email,  { _id: 0, "password": 1 }).toArray();
      console.log(user);
      const db_password = user[0].password;
      if (db_password == loginCredentials.password) {
          res.send("logged in!");
      }
      else{
          res.send("email or/and password is incorrect!");
      }
      // console.log(user);

      // if (!user) {
      //   console.log("user not found");
      //   return res.status(401).json({ message: "Authentication failed" });
      // }
  
      // const validPassword = await bcrypt.compare(password, user.get("password"));
  
      // if (!validPassword) {
      //   console.log("Password is not valid");
      //   return res.status(401).json({ message: "Authentication failed" });
      // }
  
      // return res.status(200).json({ message: "Authorization granted!" });
    } catch (err) {
      console.log("Err: ", err);
      console.log("user not found");
      return res.status(401).json({ message: "Authentication failed" })
      // res.status(500).json({ error: err });
    }
   
 });

appRouter
  .route("/settings")
  .put(upload.single("image"), function (req, response) {
    let db_connect = dbo.getDb();
    let userId = req.body.userId;
    let userChange = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      password: req.body.password,
    };

    // Check if an image file was uploaded
    if (req.file) {
      const imagePath = req.file.path; // This is the path to the saved image file
      userChange.imageUrl = imagePath; // Update the imageUrl field with the new image path
    }

    const userIdentifier = { _id: new ObjectId(userId) }; // Using ObjectId for MongoDB

    db_connect
      .collection("user_account")
      .updateOne(userIdentifier, { $set: userChange }, function (err, res) {
        if (err) {
          response.status(500).send("Error updating user data: " + err.message);
          return;
        }
        console.log("Updated data");
        response.json(res);
      });
  });

appRouter.route("/firstuserinfo").get(async (req, response) => {
  let db_connect = dbo.getDb(); // Use the existing database connection

  try {
    const firstDocument = await db_connect
      .collection("user_account")
      .findOne({}); // Fetches the first document from 'user_account' collection
    console.log("Retrieved userId:", firstDocument._id);
    response.json(firstDocument);
  } catch (error) {
    console.error("Error fetching data:", error);
    response.status(500).send("Error fetching data");
  }
});

module.exports = appRouter;
