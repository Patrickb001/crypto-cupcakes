require("dotenv").config(".env");
const cors = require("cors");
const express = require("express");
const app = express();
const morgan = require("morgan");
const { PORT = 3000 } = process.env;
const jwt = require("jsonwebtoken");
// TODO - require express-openid-connect and destructure auth from it
const { auth } = require("express-openid-connect");

const { User, Cupcake } = require("./db");

// middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
// follow the docs:

// define the config object
const {
  AUTH0_issuerBaseURL,
  AUTH0_clientID,
  AUTH0_baseURL,
  AUTH0_SECRET,
  JWT_SECRET,
} = process.env;

const config = {
  authRequired: true,
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: AUTH0_baseURL,
  clientID: AUTH0_clientID,
  issuerBaseURL: AUTH0_issuerBaseURL,
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));
app.use(async (req, res, next) => {
  const { name, email } = req.oidc.user;
  const [user] = await User.findOrCreate({
    where: {
      username: req.oidc.user.nickname,
      name,
      email,
    },
  });
  console.log(user);
  next();
});

app.use(express.static("images"));
// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  // console.log(req.oidc.user);

  res.send(`
  <div>
  <h1 style="text-align: center;"> My Web App Inc</h1>
  <h2>Welcome, ${req.oidc.user.name}</h2>
  <h3>Username ${req.oidc.user.nickname}</h3>
  <p>email: ${req.oidc.user.email}</p>
  <img src=${req.oidc.user.picture} alt="User profile picture"  />
  </div>
  `);
});

app.get("/cupcakes", async (req, res, next) => {
  try {
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get("/me", async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { username: req.oidc.user.nickname },
      raw: true,
    });
    if (user) {
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1w" });
      res.send({ user, token });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error("SERVER ERROR: ", error);
  if (res.statusCode < 400) res.status(500);
  res.send({ error: error.message, name: error.name, message: error.message });
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});
