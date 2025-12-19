const express = require("express");
const router = express.Router();
const pool = require("../../db/db");
const bycrpt = require("bcrypt");

// const categories = [];

router.post("/", async (req, res) => {
  try {
    const { userId, name, color } = req.body;

    // Checking for missing fields (userId, name, color)
    // Returning appropriate error code & messages
    if (!userId) {
      return res.status(400).json({ error: "User id is required" });
    }

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!color) {
      return res.status(400).json({ error: "Color is required" });
    }

    // successful category created
    const query =
      "INSERT INTO categories(user_id, name, color) VALUES($1, $2, $3) RETURNING *";
    const values = [userId, name, color];
    const result = await pool.query(query, values);
    res.status(201).json({
      message: "Category created successfully",
      category: result.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
