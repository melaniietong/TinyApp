const express = require("express");

const app = express();
const PORT = 8080; 

// Body Parser -- convert Buffer to string. Then add data to req() object.
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// EJS -- site templates.
app.set("view engine", "ejs");

// Object stores all saved URLs with their short version.
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Passing urlDatabase to /url EJS template.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Passing URL info for specified short URL to EJS template.
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console.
  res.send("Ok");         // Respond with 'Ok' (we will replace this).
});

// Generates a random alphanumeric 6 character string.
function generateRandomString() {
  let output = '';
  let alphanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i <= 6; i++) {
    output += alphanum[Math.floor(Math.random() * alphanum.length)]
  }
  return output;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});