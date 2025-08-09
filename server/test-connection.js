require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    console.log('Database name:', process.env.DB_NAME);
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('Current database:', result.rows[0].current_database);
    console.log('Current user:', result.rows[0].current_user);
    
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('Connection details:');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
  } finally {
    await pool.end();
  }
}

testConnection();