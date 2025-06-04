/**
 * Copyright 2025-present Coinbase Global, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { $ } from 'bun';

async function startDockerCompose() {
  console.log('Starting docker compose...');
  await $`docker compose up -d`;
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
    CREATE TABLE IF NOT EXISTS user_details (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sha256_email TEXT NOT NULL UNIQUE,
      partner_ids TEXT[] NOT NULL DEFAULT '{}'
    );
  `;
  console.log('user_details table created.');
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

    console.log('Creating table...');
    await createTable(sql);

    console.log('Setup complete.');
  } catch (err) {
    console.error('Error during setup:', err);
    process.exit(1);
  }
})();
