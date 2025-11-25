const express = require('express');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const app = express();

app.use(express.json());


app.get("/", (req, res) => {
  res.json({
    message: "Welcome to penny-wise API",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);


const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}...`));