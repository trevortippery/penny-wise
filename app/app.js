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

app.get("/transactions", (req, res) => {
  res.sendFile(path.join(viewsDir, "transactions.html"));
});

app.get("/categories", (req, res) => {
  res.sendFile(path.join(viewsDir, "categories.html"));
});

app.get("/account", (req, res) => {
  res.sendFile(path.join(viewsDir, "account.html"));
});

app.get("/addTransaction", (req, res) => {
  res.sendFile(path.join(viewsDir, "addTransaction.html"));
});

app.get("/addCategory", (req, res) => {
  res.sendFile(path.join(viewsDir, "addCategory.html"));
});

app.get("/transaction/edit/:id", (req, res) => {
  res.sendFile(path.join(viewsDir, "editTransaction.html"));
});

app.get("");
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);

module.exports = app;
