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

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM categories WHERE id = $1 and user_id = $2",
      [id, req.user.userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ category: rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const checkResult = await pool.query(
      "SELECT * FROM categories WHERE id = $1 AND user_id = $2",
      [id, req.user.userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const { id: _, user_id: __, created_at: ___, ...allowedUpdates } = req.body;

    // Validate name if it's being updated
    if (allowedUpdates.name !== undefined) {
      if (
        allowedUpdates.name === null ||
        allowedUpdates.name === "" ||
        typeof allowedUpdates.name !== "string"
      ) {
        return res.status(400).json({ error: "Name is required" });
      }
    }

    // Color validation is optional - if provided, we'll update it
    // If not provided or empty, frontend handles it
    if (allowedUpdates.color !== undefined && allowedUpdates.color === "") {
      // Remove empty string color from updates, keep existing color
      delete allowedUpdates.color;
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
    values.push(req.user.userId);

    const query = `UPDATE categories SET ${updateFields.join(", ")} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;

    const { rows } = await pool.query(query, values);

    res.status(200).json({
      message: "Category updated successfully",
      category: rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const { rows } = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({
      message: "Category deleted successfully",
      category: rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
