const express = require("express");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transaction");
const categoryRoutes = require("./routes/category");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to penny-wise API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);

module.exports = app;
