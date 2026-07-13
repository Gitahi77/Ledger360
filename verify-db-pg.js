require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // fallback

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    const result = await client.query('SELECT 1 as result');
    console.log('Connection successful! SELECT 1 returned:', result.rows);
  } catch (e) {
    console.error('Connection failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
