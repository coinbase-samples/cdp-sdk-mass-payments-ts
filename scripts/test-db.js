const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Test query
    const { rows: result } = await pool.query('SELECT 1 as test');
    console.log('Database connection successful:', result);
    
    // Test table creation if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id VARCHAR(255) PRIMARY KEY,
        address VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table check/creation successful');
    
    // Test insert
    const testId = `test-${Date.now()}`;
    await pool.query(
      'INSERT INTO wallet_addresses (id, address) VALUES ($1, $2)',
      [testId, '0x1234567890123456789012345678901234567890']
    );
    console.log('Test insert successful');
    
    // Test select
    const { rows: selectResult } = await pool.query(
      'SELECT * FROM wallet_addresses WHERE id = $1',
      [testId]
    );
    console.log('Test select successful:', selectResult);
    
    // Clean up
    await pool.query('DELETE FROM wallet_addresses WHERE id = $1', [testId]);
    console.log('Test cleanup successful');
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection(); 