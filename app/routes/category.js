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

    // check if category exsists already
    const query =
      "SELECT 1 FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1";
    const values = [req.user.userId, name];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      return res.status(400).json({ error: "Category already exists" });
    }

    // successful category created
    const query2 =
      "INSERT INTO categories(user_id, name, color) VALUES($1, $2, $3) RETURNING *";
    const values2 = [req.user.userId, name, color];
    const result2 = await pool.query(query2, values2);
    res.status(201).json({
      message: "Category created successfully",
      category: result2.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1",
      [req.user.userId],
    );
    res.status(200).json({ categories: rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
