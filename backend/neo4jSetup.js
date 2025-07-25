require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function setupConstraints() {
  const session = driver.session();
  try {
    // User: unique userId, email, familyTreeId
    await session.run('CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE');
    await session.run('CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE');
    await session.run('CREATE CONSTRAINT user_familyTreeId_unique IF NOT EXISTS FOR (u:User) REQUIRE u.familyTreeId IS UNIQUE');
    // Person: unique personId, email (optional), familyTreeId
    await session.run('CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.personId IS UNIQUE');
    await session.run('CREATE CONSTRAINT person_email_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.email IS UNIQUE');
    await session.run('CREATE INDEX person_familyTreeId IF NOT EXISTS FOR (p:Person) ON (p.familyTreeId)');
    console.log('Constraints and indexes created.');
  } catch (err) {
    console.error('Error setting up constraints:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

setupConstraints(); 