const express = require("express");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transaction");
const categoryRoutes = require("./routes/category");
const app = express();
require("dotenv").config();
const path = require("path");

app.use(express.json());

app.use(express.static(path.join(__dirname, "client")));

const viewsDir = path.join(__dirname, "client/pages");

app.get("/login", (req, res) => {
  res.sendFile(path.join(viewsDir, "login.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(viewsDir, "index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(viewsDir, "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(viewsDir, "dashboard.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(viewsDir, "about.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);

module.exports = app;
