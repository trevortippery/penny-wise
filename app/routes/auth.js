const express = require("express");
const router = express.Router();
const pool = require("../../db/db");
const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

async function comparePasswords(password, hashedPassword) {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
}

// const users = [];

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

    res.status(200).json({ message: "User successfully logged in" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const { rows } = await pool.query(
      "SELECT id, email, created_at, updated_at FROM users WHERE id = $1",
      [id],
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

module.exports = router;
