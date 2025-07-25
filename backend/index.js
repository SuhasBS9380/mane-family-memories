require('dotenv').config();
const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

app.get('/api/health', async (req, res) => {
  try {
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    res.json({ status: 'ok', neo4j: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

const familyRoutes = require('./routes/family');
app.use('/api/family', familyRoutes);

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});