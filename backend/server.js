require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./db");
const authRoutes = require("./authRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("Cash Compass Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

const passport = require("passport");
const session = require("express-session");
require("./config/passport");

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/home.html");
  },
);
