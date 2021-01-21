const express = require("express");

const app = express();
const PORT = 8080;

/* -----------------------------------------------------------------
    OTHER DEPENDENCIES
----------------------------------------------------------------- */

// Body Parser -- convert Buffer to string. Then add data to req() object.
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// EJS -- site templates.
const { render } = require("ejs");
app.set("view engine", "ejs");

// Cookie Parser -- reads cookies.
const cookieParser = require("cookie-parser");
app.use(cookieParser());

/* -----------------------------------------------------------------
    GLOBALS
----------------------------------------------------------------- */

// Stores shorten URLs with their matching long URL.
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Holds user's emails and passwords.
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// Generates a random alphanumeric 6 character string.
const generateRandomString = () => {
  let newString = '';
  let alphanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i <= 6; i++) {
    newString += alphanum[Math.floor(Math.random() * alphanum.length)];
  }
  return newString;
};

// Generates a random user ID.
const generateRandomUserID = () => {
  let newUser = 'user_';
  let randomNum = generateRandomString();

  return newUser += randomNum;
};

// Finds a user by a given email.
const getUserByEmail = (emailQuery) => {
  for (let user in users) {
    if (users[user]["email"] === emailQuery) return users[user];
  }
};

/* -----------------------------------------------------------------
    CRUD ROUTING
----------------------------------------------------------------- */

// Passing urlDatabase to /url EJS template.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_new", templateVars);
});

// Passing URL info for specified short URL to EJS template.
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']] };
  res.render("urls_show", templateVars);
});

// Redirects to shortURL page.
app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Saves URL submission and autogen short URL to urlDatabase.
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`); // Redirects to new shortURL page.
});

// Deletes a URL.
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Edit a URL.
app.post("/update/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

// Redirects short URL to long URL.
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Registration page.
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_registration", templateVars);
});

// Login page.
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_login", templateVars);
});

// User login. Saves username to cookie.
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Registers a new account.
app.post("/register", (req, res) => {
  // ERROR: Email/password input is empty.
  if (req.body.email === '' || req.body.password === '') {
    res.status(404).send('Email and/or password cannot be empty.');
    return;
  }

  // ERROR: Email is already in use.
  if (getUserByEmail(req.body.email)) {
    res.status(404).send('Email is already in use.');
    return;
  }

  const newUserID = generateRandomUserID();

  // Create a new user in users database.
  users[newUserID] = {
    id: newUserID, 
    email: req.body.email, 
    password: req.body.password
  }

  res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

// Logs out the user by clearing the cookie.
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});