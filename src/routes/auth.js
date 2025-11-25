const express = require('express');
const router = express.Router()

const users = [];

router.post("/register", (req, res) => {
  const newUser = {
    id: users.length + 1,
    email: req.body.email,
    password_hash: "***",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  users.push(newUser);
  res.status(201).json(newUser);
});

// router.post("/login", (req, res) => {});

router.get("/me", (req, res) => {
  res.json(users);
});

module.exports = router;