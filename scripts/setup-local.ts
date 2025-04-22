import { execa } from 'execa';
import { writeFile } from 'fs/promises';
import chalk from 'chalk';
import { neon } from '@neondatabase/serverless';

async function runCommand(command: string, args: string[] = []) {
  try {
    const { stdout } = await execa(command, args);
    return stdout;
  } catch (error) {
    console.error(chalk.red(`Error running ${command}:`), error);
    process.exit(1);
  }
}

async function setupLocalEnvironment() {
  console.log(chalk.blue('🚀 Starting local development setup...'));

  // Step 1: Start local Neon instance
  console.log(chalk.yellow('Starting local Neon instance...'));
  await runCommand('neonctl', ['local', 'start']);
  console.log(chalk.green('✅ Local Neon instance started'));

  // Step 2: Create database
  console.log(chalk.yellow('Creating local database...'));
  await runCommand('neonctl', ['local', 'create-db', 'cdp-mass-payouts']);
  console.log(chalk.green('✅ Database created'));

  // Step 3: Get connection string
  console.log(chalk.yellow('Getting connection string...'));
  const connectionString = await runCommand('neonctl', ['local', 'connection-string']);
  
  // Step 4: Create .env.local file
  console.log(chalk.yellow('Creating .env.local file...'));
  await writeFile('.env.local', 
    `DATABASE_URL=${connectionString}\nNODE_ENV=development\n`
  );
  console.log(chalk.green('✅ .env.local file created'));

  // Step 5: Initialize database schema
  console.log(chalk.yellow('Initializing database schema...'));
  try {
    const sql = neon(connectionString);
    
    // Create wallet_addresses table
    await sql`
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id VARCHAR(255) PRIMARY KEY,
        address VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log(chalk.green('✅ Created wallet_addresses table'));

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id VARCHAR(255) REFERENCES wallet_addresses(id),
        amount DECIMAL(20, 8),
        token_address VARCHAR(255),
        status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log(chalk.green('✅ Created transactions table'));

    // Verify tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(chalk.blue('📊 Current tables:'), tables);

  } catch (error) {
    console.error(chalk.red('❌ Database initialization failed:'), error);
    process.exit(1);
  }

  console.log(chalk.green('\n✨ Setup completed successfully!'));
  console.log(chalk.blue('\nNext steps:'));
  console.log('1. Start the development server:');
  console.log(chalk.yellow('   npm run dev'));
  console.log('2. Test the database connection:');
  console.log(chalk.yellow('   npx ts-node src/lib/test-db.ts'));
}

// Run the setup
setupLocalEnvironment(); 