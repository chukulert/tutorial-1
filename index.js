require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const mysql = require("mysql2");

// Inititalize the app and add middleware
app.set("view engine", "pug"); // Setup the pug
app.use(bodyParser.urlencoded({ extended: true })); // Setup the body parser to handle form submits
app.use(session({ secret: "super-secret" })); // Session setup

//Initialize connection with mysql
const mysqlConnection = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  multipleStatements: true,
});

/** Handle login display and form submit */
app.get("/login", (req, res) => {
  if (req.session.isLoggedIn === true) {
    return res.redirect("/");
  }
  res.render("login", { error: false });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  mysqlConnection.query(
    "SELECT * FROM accounts WHERE username = ? AND password = ? ",
    [`${username}`, `${password}`],
    function (err, results, fields) {
      if (results.length) {
        req.session.isLoggedIn = true;
        req.session.user = { ...results[0] };
        res.redirect(req.query.redirect_url ? req.query.redirect_url : "/");
      } else {
        res.render("login", { error: "Username or password is incorrect" });
      }
    }
  );
});

/** Handle logout function */
app.get("/logout", (req, res) => {
  req.session.isLoggedIn = false;
  res.redirect("/");
});

/** Simulated bank functionality */
app.get("/", (req, res) => {
  res.render("index", { isLoggedIn: req.session.isLoggedIn });
});

app.get("/balance", (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.send("Your account balance is $1234.52");
  } else {
    res.redirect("/login?redirect_url=/balance");
  }
});

app.get("/account", (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.send("Your account number is ACL9D42294");
  } else {
    res.redirect("/login?redirect_url=/account");
  }
});

app.get("/contact", (req, res) => {
  res.send("Our address : 321 Main Street, Beverly Hills.");
});

//Handle profile display
app.get("/profile", (req, res) => {
  if (req.session.isLoggedIn === true) {
    const { email, username } = req.session.user;
    res.render("profile", { email, username });
  } else {
    res.redirect("/login?redirect_url=/profile");
  }
});

//Handle edit email form display and form submit
app.get("/profile/edit", (req, res) => {
  if (req.session.isLoggedIn === true) {
    const { email } = req.session.user;
    res.render("edit", { email });
  } else {
    res.redirect("/login?redirect_url=/profile");
  }
});

app.post("/profile/edit", (req, res) => {
  const { inputEmail } = req.body;
  const { id, email } = req.session.user;

  if (!inputEmail.length) {
    res.render("edit", { email, error: "Please enter a valid email address." });
  } else {
    mysqlConnection.query(
      "UPDATE accounts SET email = ? WHERE id = ?",
      [`${email}`, `${id}`],
      function (err, results, fields) {
        if (err) {
          res.render("edit", {
            email: inputEmail,
            error: "Something went wrong. Please try again.",
          });
        } else {
          req.session.user.email = inputEmail;
          res.redirect("/profile");
        }
      }
    );
  }
});

/** App listening on port */
app.listen(port, () => {
  console.log(`MyBank app listening at http://localhost:${port}`);
});
