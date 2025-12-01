const express = require('express');
const router = express.Router();
const pool = require("../../db/db");
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

async function comparePasswords(password, hashedPassword) {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
}

const users = [];

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || email.trim() === "") {
    res.status(400).json({error: "Email is required"});
    return;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if(!emailRegex.test(email)) {
    res.status(400).json({error: "Invalid email format"});
    return;
  }

  if(users.find(user => user.email === email)) {
    res.status(400).json({error: "Email already exists"});
    return;
  }

  if (!password || password.trim() === "") {
    res.status(400).json({error: "Password is required"});
    return;
  }

  try {
    const hashed = await hashPassword(req.body.password);

    const newUser = {
      id: users.length + 1,
      email: req.body.email,
      password_hash: hashed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    users.push(newUser);
    res.status(201).json({message: "User created successfully"});

  } catch(err) {
    console.log(err);
    res.status(500).json({error: "Something went wrong"});
  }

});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || email.trim() === "") {
    res.status(400).json({error: "Email is required"});
    return;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if(!emailRegex.test(email)) {
    res.status(400).json({error: "Invalid email format"});
    return;
  }

  if (!password || password.trim() === "") {
    res.status(400).json({error: "Password is required"});
    return;
  }

  try {
    const potentialUser = users.find(user => user.email === email);

    if (!potentialUser) {
      res.status(401).json({error: "Invalid credentials"});
      return;
    }

    const comparison = await comparePasswords(password, potentialUser.password_hash);

    if (!comparison) {
      res.status(401).json({error: "Invalid credentials"});
      return
    }

    res.status(200).json({message: "User successfully logged in"});
  } catch(err) {
    console.log(err);
    res.status(500).json({error: "Internal server error"});
  }

});

router.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    res.status(404).json({error: "User not found"});
    return;
  }

  res.status(200).json(user);
});

module.exports = router;