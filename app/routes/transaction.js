const express = require("express");
const router = express.Router();
const pool = require("../../db/db");

const Transactions = {
  DEPOSIT: "deposit",
  WITHDRAW: "withdraw",
};

router.post("/", async (req, res) => {
  try {
    const { userId, amount, date, type, categoryId, description } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User id is required" });
    }

    if (amount === undefined || amount === null) {
      return res
        .status(400)
        .json({ error: "Amount for transaction is required" });
    }

    if (typeof amount !== "number" || amount === 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a non-zero number" });
    }

    if (!date) {
      return res
        .status(400)
        .json({ error: "Date is required for transaction" });
    }

    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (!type) {
      return res.status(400).json({ error: "Transaction type is required" });
    }

    if (type !== Transactions.DEPOSIT && type !== Transactions.WITHDRAW) {
      return res.status(400).json({ error: "Invalid type of transaction" });
    }

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    if (typeof categoryId !== "number") {
      return res.status(400).json({ error: "Category ID must be a number" });
    }

    const { rows } = await pool.query(
      "INSERT INTO transactions(user_id, amount, type, category_id, description, date) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, amount, type, categoryId, description || null, date],
    );

    res
      .status(201)
      .json({
        message: "Transaction created successfully",
        transaction: rows[0],
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC",
      [parsedUserId],
    );

    res.status(200).json({ transactions: rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM transactions WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(200).json({ transaction: rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const checkResult = await pool.query(
      "SELECT * FROM transactions WHERE id = $1",
      [id],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const { id: _, user_id: __, created_at: ___, ...allowedUpdates } = req.body;

    if (allowedUpdates.amount !== undefined) {
      if (
        typeof allowedUpdates.amount !== "number" ||
        allowedUpdates.amount === 0
      ) {
        return res
          .status(400)
          .json({ error: "Amount must be a non-zero number" });
      }
    }

    if (allowedUpdates.date !== undefined) {
      if (isNaN(Date.parse(allowedUpdates.date))) {
        return res.status(400).json({ error: "Invalid date format" });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(allowedUpdates)) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const query = `UPDATE transactions SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`;

    const { rows } = await pool.query(query, values);

    res
      .status(200)
      .json({
        message: "Transaction updated successfully",
        transaction: rows[0],
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE transaction
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const { rows } = await pool.query(
      "DELETE FROM transactions WHERE id = $1 RETURNING *",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(200).json({
      message: "Transaction deleted successfully",
      transaction: rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
