const express = require("express");
const router = express.Router();
const pool = require("../../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../middleware/authMiddleware");

async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

async function comparePasswords(password, hashedPassword) {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === "") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (rows.length > 0) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    if (!password || password.trim() === "") {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const hashed = await hashPassword(req.body.password);
    const query2 =
      "INSERT INTO users(email, password_hash, updated_at) VALUES($1, $2, NOW()) RETURNING id, email, created_at";
    const values = [email, hashed];
    const result = await pool.query(query2, values);

    res
      .status(201)
      .json({ message: "User created successfully", user: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === "") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (!password || password.trim() === "") {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const comparison = await comparePasswords(password, rows[0].password_hash);

    if (!comparison) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      {
        userId: rows[0].id,
        email: email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res
      .status(200)
      .json({ message: "User successfully logged in", token: token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, created_at, updated_at FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || currentPassword.trim() === "") {
      return res.status(400).json({ error: "Current password is required" });
    }

    if (!newPassword || newPassword.trim() === "") {
      return res.status(400).json({ error: "New password is required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    const isCurrentPasswordValid = await comparePasswords(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Check if new password is different from old password
    const isSamePassword = await comparePasswords(
      newPassword,
      user.password_hash,
    );
    if (isSamePassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    const newHashedPassword = await hashPassword(newPassword);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newHashedPassword, req.user.userId],
    );

    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(200).json({
      message: "Password updated successfully",
      token: newToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
