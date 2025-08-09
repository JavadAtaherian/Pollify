// server/scripts/setup-database.js
const fs = require('fs');
const path = require('path');
const pool = require('../src/database');

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log('✓ Executed statement successfully');
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists')) {
            throw err;
          } else {
            console.log('⚠ Table/index already exists, skipping...');
          }
        }
      }
    }
    
    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;