const express = require('express');
const router = express.Router();

const transactionsList = [];

router.post("/", (req, res) => {
  try {
    const { userId, amount, date, type, categoryId, description } = req.body;

    if (!userId) {
      return res.status(400).json({error: "User id is required"});
    }

    if (!amount) {
      return res.status(400).json({error: "Amount for transaction is required"});
    }

    if (typeof amount !== 'number' || amount === 0) {
      return res.status(400).json({error: "Amount must be a non-zero number"});
    }

    if (!date) {
      return res.status(400).json({error: "Date is required for transaction"});
    }

    if (isNaN(Date.parse(date))) {
      return res.status(400).json({error: "Invalid date format"});
    }

    if (!type) {
      return res.status(400).json({error: "Transaction type is required"});
    }

    const newTransaction = {
      id: transactionsList.length + 1,
      userId: userId,
      amount: amount,
      type: type,
      categoryId: categoryId || null,
      description: description || "",
      date: date,
      createdAt: new Date().toISOString()
    };

    transactionsList.push(newTransaction);
    res.status(201).json(newTransaction);

  } catch(err) {
    console.log(err);
    res.status(500).json({error: "Internal server error"});
  }
});

router.get("/", (req, res) => {
  try {
    const { userId } = req.query;

    if (userId) {
      const userTransactions = transactionsList.filter(t => t.userId === parseInt(userId));
      return res.status(200).json(userTransactions);
    }

    res.status(200).json(transactionsList);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const transaction = transactionsList.find(t => t.id === id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const index = transactionsList.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const { id: _, userId: __, createdAt: ___, ...allowedUpdates } = req.body;

    if (allowedUpdates.amount !== undefined) {
      if (typeof allowedUpdates.amount !== 'number' || allowedUpdates.amount === 0) {
        return res.status(400).json({ error: "Amount must be a non-zero number" });
      }
    }

    if (allowedUpdates.date !== undefined) {
      if (isNaN(Date.parse(allowedUpdates.date))) {
        return res.status(400).json({ error: "Invalid date format" });
      }
    }

    transactionsList[index] = {
      ...transactionsList[index],
      ...allowedUpdates
    };

    res.status(200).json(transactionsList[index]);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const index = transactionsList.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const deletedTransaction = transactionsList[index];
    transactionsList.splice(index, 1);

    res.status(200).json({
      message: "Transaction deleted successfully",
      transaction: deletedTransaction
    });
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;