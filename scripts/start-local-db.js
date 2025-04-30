import { neon, neonConfig } from '@neondatabase/serverless';
import { $ } from 'bun';

async function startDockerCompose() {
  console.log('Starting docker-compose...');
  await $`docker-compose up -d`;
}

async function waitForDbReady(sql, retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sql`SELECT 1`;
      console.log('DB is ready.');
      return;
    } catch (err) {
      console.log(`Waiting for DB (${i + 1}/${retries})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('DB did not become ready in time.');
}

async function createTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS wallet_addresses (
      id TEXT PRIMARY KEY,
      address TEXT NOT NULL
    );
  `;
  console.log('wallet_addresses table created.');
}

(async () => {
  try {
    neonConfig.fetchEndpoint = (host) => {
      const [protocol, port] = host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
      return `${protocol}://${host}:${port}/sql`;
    };

    console.log('Starting local DB...');
    await startDockerCompose();

    const sql = neon('postgres://postgres:postgres@db.localtest.me:5432/main');

    console.log('Waiting for DB to be ready...');
    await waitForDbReady(sql);

    console.log('Creating wallet_addresses table...');
    await createTable(sql);

    console.log('Setup complete.');
  } catch (err) {
    console.error('Error during setup:', err);
    process.exit(1);
  }
})();
