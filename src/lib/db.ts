import { neon } from '@neondatabase/serverless';
import { config } from './config';

const sql = neon(config.DATABASE_URL);

export async function getOrCreateWallet(id: string) {
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