const express = require("express");
const router = express.Router();
const pool = require("../../db/db");
const verifyToken = require("../../middleware/authMiddleware");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!color) {
      return res.status(400).json({ error: "Color is required" });
    }

    // successful category created
    const query =
      "INSERT INTO categories(user_id, name, color) VALUES($1, $2, $3) RETURNING *";
    const values = [req.user.userId, name, color];
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
