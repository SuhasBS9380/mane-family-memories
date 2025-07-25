const express = require('express');
const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');
const bcrypt = require('bcrypt');
const authenticate = require('../middleware/auth');

require('dotenv').config();
const router = express.Router();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

function generateTempPassword() {
  return Math.random().toString(36).slice(-6);
}

// POST /api/family/add
router.post('/add', authenticate, async (req, res) => {
  const { existingPersonId, relationshipType, newMemberName, newMemberEmail } = req.body;
  console.log('RELATIONSHIP TYPE RECEIVED:', relationshipType);
  const { userId, familyTreeId } = req.user;
  if (!newMemberName) {
    return res.status(400).json({ error: 'Missing new member name' });
  }
  const session = driver.session();
  let tempPassword = req.body.tempPassword || null;
  if (!tempPassword || tempPassword.trim() === '') {
    return res.status(400).json({ error: 'Temporary password is required' });
  }
  console.log('TEMP PASSWORD SENT TO NEO4J:', tempPassword);
  try {
    const newPersonId = uuidv4();
    // Check if newMemberEmail is provided and not registered
    if (newMemberEmail) {
      const userExists = await session.run('MATCH (u:User {email: $email}) RETURN u', { email: newMemberEmail });
      if (!userExists.records.length) {
        const userId = uuidv4();
        // Create User node with only plainPassword (no hashedPassword), isAdmin: false
        await session.run(
          'CREATE (u:User {userId: $userId, name: $newMemberName, email: $newMemberEmail, plainPassword: $tempPassword, familyTreeId: $familyTreeId, isAdmin: $isAdmin})',
          { userId, newMemberName, newMemberEmail, tempPassword, familyTreeId, isAdmin: false }
        );
      } else {
        tempPassword = userExists.records[0].get('u').properties.plainPassword || '';
      }
    }
    // Always use the password from the request for the Person node, isAdmin: false
    await session.run(
      'CREATE (p:Person {personId: $newPersonId, name: $newMemberName, email: $newMemberEmail, familyTreeId: $familyTreeId, plainPassword: $plainPassword, isAdmin: $isAdmin})',
      {
        newPersonId,
        newMemberName,
        newMemberEmail: newMemberEmail || '',
        familyTreeId,
        plainPassword: tempPassword,
        isAdmin: false
      }
    );
    // Only create relationship if existingPersonId and relationshipType are provided
    if (existingPersonId && relationshipType) {
      if (relationshipType === 'SON_OF') {
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (a)-[:SON_OF]->(b)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (b)-[:CHILD_OF]->(a)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
      } else if (relationshipType === 'HUSBAND_OF') {
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (a)-[:HUSBAND_OF]->(b)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (b)-[:WIFE_OF]->(a)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
      } else if (relationshipType === 'WIFE_OF') {
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (a)-[:WIFE_OF]->(b)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (b)-[:HUSBAND_OF]->(a)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
      } else if (relationshipType === 'SIBLING_OF') {
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (a)-[:SIBLING_OF]->(b)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
        await session.run(
          `MATCH (a:Person {personId: $existingPersonId, familyTreeId: $familyTreeId}), (b:Person {personId: $newPersonId, familyTreeId: $familyTreeId})
           CREATE (b)-[:SIBLING_OF]->(a)`,
          { existingPersonId, newPersonId, familyTreeId }
        );
      }
    }
    res.json({ success: true, newPersonId, tempPassword, newMemberEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// GET /api/family/tree
router.get('/tree', authenticate, async (req, res) => {
  const { familyTreeId } = req.user;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Person {familyTreeId: $familyTreeId})
       OPTIONAL MATCH (p)-[r]->(q:Person {familyTreeId: $familyTreeId})
       RETURN p, r, q`,
      { familyTreeId }
    );
    // Format nodes and relationships for frontend
    const nodes = {};
    const edges = [];
    result.records.forEach(record => {
      const p = record.get('p').properties;
      nodes[p.personId] = { ...p };
      if (record.get('r') && record.get('q')) {
        const q = record.get('q').properties;
        nodes[q.personId] = { ...q };
        edges.push({ from: p.personId, to: q.personId, type: record.get('r').type });
      }
    });
    // Find the owner's email
    const ownerResult = await session.run(
      'MATCH (u:User {familyTreeId: $familyTreeId}) RETURN u.email AS ownerEmail LIMIT 1',
      { familyTreeId }
    );
    const ownerEmail = ownerResult.records.length ? ownerResult.records[0].get('ownerEmail') : null;
    res.json({ nodes: Object.values(nodes), edges, ownerEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;