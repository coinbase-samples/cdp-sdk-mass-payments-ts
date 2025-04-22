const { execSync } = require('child_process');
const fs = require('fs');
const { Pool } = require('pg');

function runCommand(command, args = []) {
  try {
    return execSync(`${command} ${args.join(' ')}`, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error running ${command}:`, error);
    process.exit(1);
  }
}

async function setupLocalEnvironment() {
  console.log('Starting local development setup...');

  // Step 1: Start PostgreSQL with Docker Compose
  console.log('Starting PostgreSQL with Docker Compose...');
  runCommand('docker-compose', ['up', '-d']);
  console.log('PostgreSQL container started');

  // Wait for PostgreSQL to be ready
  console.log('Waiting for PostgreSQL to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Create .env.local file with connection string
  console.log('Creating .env.local file...');
  const connectionString = 'postgresql://postgres:postgres@localhost:5432/cdp_mass_payouts';
  fs.writeFileSync('.env.local', 
    `DATABASE_URL=${connectionString}\nNODE_ENV=development\n`
  );
  console.log('.env.local file created');

  // Step 3: Initialize database schema
  console.log('Initializing database schema...');
  try {
    const pool = new Pool({
      connectionString: connectionString
    });
    
    // Create wallet_addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id VARCHAR(255) PRIMARY KEY,
        address VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created wallet_addresses table');

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id VARCHAR(255) REFERENCES wallet_addresses(id),
        amount DECIMAL(20, 8),
        token_address VARCHAR(255),
        status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created transactions table');

    // Verify tables
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Current tables:', tables);

    // Close the pool
    await pool.end();

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }

  console.log('\nSetup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the development server:');
  console.log('   npm run dev');
  console.log('2. Test the database connection:');
  console.log('   npm run test:db');
  console.log('\nTo stop the database:');
  console.log('   docker-compose down');
}

// Run the setup
setupLocalEnvironment(); 