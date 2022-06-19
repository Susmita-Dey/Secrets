//jshint esversion:6

require("dotenv").config();
// console.log(process.env); // remove this after you've confirmed it working

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
// For authentication
const LocalStrategy = require("passport-local");
// const passportLocal = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })
  .then(()=>{
    console.log("connected to DB");
  })
  .catch(err=>{
    console.log("error:", err.message);
  })

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose); //this will encrypt,hash and salt the data for us.

const User = new mongoose.model("User", userSchema);

// passport.use(new passportLocal(User.authenticate()));
passport.use(User.createStrategy());

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false,
  })
);

// For authentication and session passport local
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

// Avoid call back hell
// app.post("/register", function (req, res) {
//   User.register(
//     { username: req.body.username },
//     req.body.password,
//     (err, user) => {
//       if (err) {
//         console.log(err);
//         res.redirect("/register");
//       } else {
//         passport.authenticate("local")(req, res, function () {
//           res.redirect("/secrets");
//         });
//       }
//     }
//   );
// });

// Much better with async and await.
app.post("/register", async function (req, res){
  try {
    const { username, password } = req.body;
  
    const user = new User({
      username,
      password
    });
    const registeredUser = await User.register(user, password);
    /**
    * Login the user after registration,
    * helper function provided by passport.
    */
    req.login(registeredUser, err => {
        if (err) {
          console.log(err);
          return res.redirect("/register");
        };
        res.redirect("/secrets");
    })
  } catch (err){
    console.log(err);
    res.redirect("/register");
  }
})

app.post("/login", function (req, res) {});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
