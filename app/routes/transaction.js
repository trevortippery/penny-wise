const express = require('express');
const router = express.Router();

const transactionsList = [];

router.post("/", (req, res) => {
  const newTransaction = {
    id: transactionsList.length + 1,
    user_id: req.body.user_id,
    amount: req.body.amount,
    type: req.body.type,
    category_id: req.body.category_id,
    description: req.body.description,
    date: req.body.date,
    created_at: new Date().toISOString()
  };

  transactionsList.push(newTransaction);
  res.status(201).json(newTransaction);
});

router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = transactionsList.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  transactionsList[index] = { ...transactionsList[index], ...req.body };
  res.status(200).json(transactionsList[index]);
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = transactionsList.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  transactionsList.splice(index, 1);
  res.status(200).json({ message: "Transaction deleted" });
});

router.get("/", (req, res) => {
  res.status(200).json(transactionsList);
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const transaction = transactionsList.find(t => t.id === id);

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  res.status(200).json(transaction);
});

module.exports = router;