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
import { config } from './config';

if (config.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] = host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
    return `${protocol}://${host}:${port}/sql`;
  };
}

const sql = neon(config.DATABASE_URL);

export async function getWalletAddress(id: string) {
  const result = await sql`
    SELECT address 
    FROM wallet_addresses 
    WHERE id = ${id}
  `;

  if (result.length > 0) {
    return result[0];
  }

  return null;
}

export async function createWallet(id: string, address: string) {
  await sql`
    INSERT INTO wallet_addresses (id, address)
    VALUES (${id}, ${address})
  `;
} 
