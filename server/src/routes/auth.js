// server/src/routes/auth.js
const express = require('express');
const { User } = require('../models');

const router = express.Router();

// POST /auth/signup
// Create a new admin user. Requires name, email and password in the request
// body. Responds with the created user (id, name, email, role).
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }
    // Check for existing user with the same email
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email is already in use' });
    }
    const user = await User.createUser({ name, email, password, role: 'admin' });
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// POST /auth/login
// Authenticate an admin user. Requires email and password in the request
// body. Responds with the user record (id, name, email, role) if the
// credentials are valid.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    // Verify password
    if (!User.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    // Return user details without password_hash
    const { id, name, role } = user;
    return res.json({ success: true, data: { id, name, email, role } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

module.exports = router;