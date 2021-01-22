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

// Cookie Session -- encrypts cookies.
const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['secret'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Bcrypt -- hashes passwords.
const bcrypt = require('bcrypt');

/* -----------------------------------------------------------------
    GLOBALS
----------------------------------------------------------------- */

// Finds a user by a given email.
const { getUserByEmail } = require("./helpers");

// Stores shorten URLs with their matching long URL.
const urlDatabase = {
  example: { longURL: "https://www.example.ca", userID: "userRandomID" },
};

// Holds user's emails and passwords.
const users = {
  "user_example": {
    id: "user_example",
    email: "user@example.com",
    password: "example" // This would be hashed.
  },
};

// Filters URL database based on logged in user.
const filterURLDatabase = (user, database) => {
  const filteredDatabase = {};
  for (let shortURL in database) {
    // If user owns the short URL, add the short URL to the filtered database.
    if (database[shortURL]["userID"] === user) {
      filteredDatabase[shortURL] = database[shortURL];
    }
  }
  return filteredDatabase;
};

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
const generateRandomUserID = randomString => {
  let newUser = 'user_';

  return newUser += randomString();
};

/* -----------------------------------------------------------------
    CRUD ROUTING
----------------------------------------------------------------- */

// Redirects to /urls.
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Render: My URLs page.
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: filterURLDatabase(req.session.userID, urlDatabase),
    user: users[req.session.userID] };
  res.render("urls_index", templateVars);
});

// Render: New URL page.
app.get("/urls/new", (req, res) => {
  // If user is logged in, they can create a new URL.
  if (req.session.userID) {
    const templateVars = { user: users[req.session.userID] };
    res.render("urls_new", templateVars);
  } else { // If not redirects to login page.
    res.redirect("/login");
  }
});

// Render: Short URL page.
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    const templateVars = {
      shortURL: undefined,
      longURL: "Error",
      user: users[req.session.userID]
    };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user: users[req.session.userID],
      owner: urlDatabase[req.params.shortURL]["userID"]
    };
    res.render("urls_show", templateVars);
  }
});

// Redirects to shortURL page.
app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

// When user creates a new URL, assigns URL to a short URL and saves it in the database.
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  };

  // Redirects to new shortURL page.
  res.redirect(`/urls/${shortURL}`);
});

// User presses delete button and short URL is deleted.
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.userID !== undefined && req.session.userID === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else { // ERROR: Being accessed by non-owner.
    res.status(403).send('You do not have permission to edit this.');
    return;
  }
});

// On short URL page, user can edit the URL and update it.
app.post("/update/:id", (req, res) => {
  if (req.session.userID !== undefined && req.session.userID === urlDatabase[req.params.id]["userID"]) {
    urlDatabase[req.params.id]["longURL"] = req.body.longURL;
    res.redirect(`/urls/${req.params.id}`);
  } else { // ERROR: Being accessed by non-owner.
    res.status(403).send('You do not have permission to edit this.');
    return;
  }
});

// Short URL goes to website.
app.get("/u/:shortURL", (req, res) => {
  const website = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(website);
});

// Render: Registration page.
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.userID] };
  res.render("urls_registration", templateVars);
});

// Render: Login page.
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.userID] };
  res.render("urls_login", templateVars);
});

// On the Login page, user can login with their email and password.
app.post("/login", (req, res) => {
  // ERROR: Email/password input is empty.
  if (req.body.email === '' || req.body.password === '') {
    res.status(404).send('Email and/or password cannot be empty.\nPlease try again.');
    return;
  }

  const loggingInUser = getUserByEmail(req.body.email, users);

  // Email is in the database.
  if (loggingInUser) {
    // Email and password match.
    if (bcrypt.compareSync(req.body.password, loggingInUser.password)) {
      req.session.userId = loggingInUser.id;
      res.redirect("/urls");
    } else { // ERROR: Incorrect password.
      res.status(403).send('Incorrect password.\nPlease try again.');
      return;
    }
  } else { // ERROR: Email isn't in the user database.
    res.status(403).send('Email is not associated with an account.\nPlease register for an account.');
    return;
  }
});

// On the Registration page, user can register a new account with email and password.
app.post("/register", (req, res) => {
  // ERROR: Email/password input is empty.
  if (req.body.email === '' || req.body.password === '') {
    res.status(404).send('Email and/or password cannot be empty.\nPlease try again.');
    return;
  }

  // ERROR: Email is already in use.
  if (getUserByEmail(req.body.email, users)) {
    res.status(404).send('Email is already in use.\nPlease use a different email or login.');
    return;
  }

  const newUserID = generateRandomUserID(generateRandomString);

  // Hashing the password.
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create a new user in users database.
  users[newUserID] = {
    id: newUserID,
    email: req.body.email,
    password: hashedPassword
  };

  req.session.userID = newUserID;
  res.redirect("/urls");
});

// When user clicks the logout button, their login is cleared from the cookie.
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});