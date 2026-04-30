const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory user store (replace with MongoDB in production)
const users = [
  {
    id: 1,
    name: 'Farm Admin',
    email: 'admin@smartfarm.com',
    password: bcrypt.hashSync('farm1234', 10),
    role: 'admin',
    farm: 'Green Valley Farm'
  },
  {
    id: 2,
    name: 'John Farmer',
    email: 'john@smartfarm.com',
    password: bcrypt.hashSync('john1234', 10),
    role: 'farmer',
    farm: 'Sunrise Fields'
  }
];

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      farm: user.farm
    }
  });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, farm } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: 'farmer',
    farm: farm || 'My Farm'
  };
  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      farm: newUser.farm
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, farm: user.farm });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
