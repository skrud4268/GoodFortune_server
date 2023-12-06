const express = require("express");
//const session = require("express-session");
// const bcrypt = require('bcrypt');
const { ObjectId } = require("mongodb");
const multer = require("multer");
// const { Storage } = require("@google-cloud/storage");
import MulterGoogleCloudStorage from "multer-cloud-storage";

const upload = multer({
  storage: new MulterGoogleCloudStorage({
    bucket: "bucket-quickstart_keen-vial-407222", // Your Google Cloud Storage Bucket Name
    projectId: "keen-vial-407222", // Your Google Cloud Project ID
    keyFilename: "routes/keen-vial-407222-cb9490b288b9.json", // Path to Google Cloud Service Account JSON Keyfile
    filename: (req, file, cb) => {
      // Optional filename configuration
      // Set custom filename, if needed
      const filename = `${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // Optional file size limit
});

// The router will be added as a middleware and will take control of requests starting with path /record.
const appRouter = express.Router();

//var session;

const dbo = require("../database/conn");
dbo.connectToServer();

appRouter.route("/").get(function (req, res) {
  // if(!req.session.user){
  //     res.redirect('/login');
  // }
  // res.send("Root directory");
  res.send("Home Page");
});

// This section will help you create a new user.
appRouter.route("/login").post(async function (req, response) {
  let db_connect = dbo.getDb();
  let loginCredentials = {
    email: req.body.email,
    password: req.body.password,
  };
  console.log(loginCredentials);

  var email = { email: loginCredentials.email };
  const results = await db_connect
    .collection("user_account")
    .find(email, { _id: 0, password: 1 })
    .toArray();

  console.log(results);

  const db_password = results[0].password;
  if (db_password == loginCredentials.password) {
    response.send("logged in!");
  } else {
    response.send("email or/and password is incorrect!");
  }
});

appRouter.route("/register").post(async function (req, response) {
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
  const results = await db_connect
    .collection("user_account")
    .insertOne(newUser);
  response.json(results);
});

appRouter
  .route("/upload")
  .post(upload.single("image"), async function (req, res) {
    if (req.file) {
      const fileUrl = `https://storage.googleapis.com/${req.file.bucket}/${req.file.filename}`;

      // Assuming the userId is sent in the request body or query. Modify as needed.
      const userId = req.body.userId || req.query.userId;
      if (!userId) {
        return res.status(400).send("User ID is required.");
      }

      let db_connect = dbo.getDb();
      const userIdentifier = { _id: new ObjectId(userId) };

      try {
        // Update the imageUrl field in the user_account collection
        await db_connect
          .collection("user_account")
          .updateOne(userIdentifier, { $set: { imageUrl: fileUrl } });

        res.json({
          message: "File uploaded and user image updated successfully",
          fileUrl: fileUrl,
        });
      } catch (error) {
        res
          .status(500)
          .send("Error updating user image in database: " + error.message);
      }
    } else {
      res.status(400).send("No file uploaded.");
    }
  });

appRouter.route("/settings").put(async function (req, response) {
  let db_connect = dbo.getDb();
  console.log("Request body:", req.body);
  let userId = req.body.userId;
  let userChange = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    confirmEmail: req.body.confirmEmail,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    pronoun: req.body.pronoun,
  };

  // console.log(userChange);
  // Check if an image file was uploaded
  if (req.file) {
    const imagePath = req.file.path; // This is the path to the saved image file
    userChange.imageUrl = imagePath; // Update the imageUrl field with the new image path
  }

  const userIdentifier = { _id: new ObjectId(userId) }; // Using ObjectId for MongoDB

  // const res = await db_connect
  //   .collection("user_account")
  //   .updateOne(userIdentifier, { $set: userChange }, async function (err, res) {
  //     if (err) {
  //       response.status(500).send("Error updating user data: " + err.message);
  //       return();
  //     }
  //     console.log("Updated data");
  //     response.json(res);
  //   });

  // const results = await db_connect
  //   .collection("user_account")
  //   .updateOne(userIdentifier, { $set: userChange });
  // response.json(results);

  try {
    const results = await db_connect
      .collection("user_account")
      .updateOne(userIdentifier, { $set: userChange });

    console.log("Matched count:", results.matchedCount);
    console.log("Modified count:", results.modifiedCount);

    if (results.matchedCount === 0) {
      console.log("No matching document found for ID:", userId);
      response.status(404).send("User not found.");
    } else if (results.modifiedCount === 0) {
      console.log("No changes were made to the document.");
      response.status(200).send("No changes needed.");
    } else {
      console.log("User updated successfully.");
      response.json(results);
    }
  } catch (err) {
    console.error("Error updating user data:", err);
    response.status(500).send("Error updating user data: " + err.message);
  }
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
