var express = require("express");
var mongoose = require("mongoose");
var sessions = require("client-sessions");
var bcrypt = require("bcrypt");

let app = express();

// MiddleWares - to access information
app.use(express.urlencoded({ extended: true }));
app.use(
  sessions({
    cookieName: "intellipaat", // cookie name dictates the key name added to the request object
    secret: "qwertyuiopasdfghjklzxcvbnm", // should be a large unguessable string
    duration: 30 * 60 * 1000, // how long the session will stay valid in ms
    activeDuration: 5 * 60 * 1000, // how long the session will stay valid in ms
    cookie: {
      ephemeral: false, // when true, cookie expires when the browser closes
    },
  })
);

// console.log(bcrypt.hashSync("sadiq", bcrypt.genSaltSync(5)));

// DB Configuration
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = mongoose.model(
  "User",
  new Schema({
    id: ObjectId,
    firstname: String,
    lastname: String,
    username: { type: String, unique: true },
    password: String,
  })
);
var url =
  "mongodb+srv://sadiq08:yj8xwvAJE4eSgZCZ@cluster0.7ya1ans.mongodb.net/onlinedb?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(url)
  .then(function (res) {
    console.log("DB is Connected");
  })
  .catch(function (error) {
    console.log("error", error);
  });

//Routes
app.get("/", function (req, res) {
  res.render("home.pug");
});
app.get("/signin", function (req, res) {
  res.render("signin.pug");
});
app.post("/signin", function (req, res) {
  User.findOne({ username: req.body.username })
    .then(function (dbres) {
      if (dbres.username == req.body.username) {
        if (bcrypt.compareSync(req.body.password, dbres.password)) {
          req.intellipaat.user = dbres;
          res.redirect("/profile");
        } else {
          res.status(404).render("sign.pug", {
            error: "Invalid username or password",
          });
        }
      }
    })
    .catch(function (err) {
      res.status(500).render("signin.pug", {
        error: "No User found with that credential",
      });
    });
});

app.get("/signup", function (req, res) {
  res.render("signup.pug");
});
app.post("/signup", function (req, res) {
  var hashedPass = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(5));
  var user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    password: hashedPass,
  });
  user
    .save()
    .then(function (dbres) {
      res.redirect("/signin");
      console.log(
        "User is Created",
        dbres ? dbres.username : "Undefined",
        " was added"
      );
    })
    .catch(function (err) {
      if (err.code == 11000) {
        res.render("signup.pug", {
          error: "Username already exists",
        });
      } else {
        res.render("signup.pug", {
          error: "something went wrong please try again later",
        });
      }
      console.log("error", err);
    });
});
app.get("/profile", function (req, res) {
  if (req.intellipaat && req.intellipaat.user) {
    User.findOne({ username: req.intellipaat.user.username })
      .then(function (dbres) {
        res.render("profile.pug", {
          userdetails: dbres,
        });
      })
      .catch(function (error) {
        req.intellipaat.reset();
        res.redirect("/signin");
      });
  } else {
    res.redirect("/signin");
  }
});
app.get("/logout", function (req, res) {
  req.intellipaat.reset();
  res.redirect("/");
});

// Creating ports
app.listen(2525, "localhost", function (error) {
  if (error) {
    console.log("Error ", error);
  } else {
    console.log("server is now live on localhost:2525");
  }
});
