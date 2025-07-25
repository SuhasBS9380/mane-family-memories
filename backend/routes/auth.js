const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const router = express.Router();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    { userId: user.userId, familyTreeId: user.familyTreeId, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const session = driver.session();
  try {
    // Check if user exists
    const exists = await session.run('MATCH (u:User {email: $email}) RETURN u', { email });
    if (exists.records.length) return res.status(409).json({ error: 'Email already registered' });
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const familyTreeId = uuidv4();
    const personId = uuidv4();
    // Create User and Person nodes, link them, mark as admin (hardcoded boolean true)
    await session.run(
      'CREATE (u:User {userId: $userId, name: $name, email: $email, hashedPassword: $hashedPassword, familyTreeId: $familyTreeId, isAdmin: true}) '
      + 'CREATE (p:Person {personId: $personId, name: $name, email: $email, familyTreeId: $familyTreeId, isAdmin: true}) '
      + 'CREATE (u)-[:HAS_PERSON]->(p)',
      { userId, name, email, hashedPassword, familyTreeId, personId }
    );
    console.log('Created User and Person with isAdmin: true', { userId, email });
    const token = generateToken({ userId, familyTreeId, email, isAdmin: true });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const session = driver.session();
  try {
    const result = await session.run('MATCH (u:User {email: $email}) RETURN u', { email });
    if (!result.records.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.records[0].get('u').properties;
    // If plainPassword exists, compare directly (for test/demo users)
    if (user.plainPassword) {
      if (user.plainPassword !== password) return res.status(401).json({ error: 'Invalid credentials' });
    } else {
      const match = await bcrypt.compare(password, user.hashedPassword);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('Login user isAdmin:', user.isAdmin);
    const token = generateToken({ userId: user.userId, familyTreeId: user.familyTreeId, email: user.email, isAdmin: user.isAdmin === true || user.isAdmin === 'true' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router; 