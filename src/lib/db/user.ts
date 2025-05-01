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

import { createHash } from 'crypto';
import { sql } from "@/lib/db/neon";

export type UserDetails = {
  userId: string;
  sha256Email: string;
  partnerIds: string[];
};

export async function getUserByEmailHash(sha256Email: string): Promise<UserDetails | null> {
  const result = await sql`
    SELECT user_id, sha256_email, partner_ids
    FROM user_details
    WHERE sha256_email = ${sha256Email}
  `;

  if (result.length > 0) {
    return {
      userId: result[0].user_id,
      sha256Email: result[0].sha256_email,
      partnerIds: result[0].partner_ids,
    };
  }

  return null;
}

export async function createUser(sha256Email: string, partnerId: string): Promise<UserDetails> {
  const result = await sql`
    INSERT INTO user_details (sha256_email, partner_ids)
    VALUES (${sha256Email}, ARRAY[${partnerId}])
    RETURNING user_id, sha256_email, partner_ids
  `;

  return {
    userId: result[0].user_id,
    sha256Email: result[0].sha256_email,
    partnerIds: result[0].partner_ids,
  };
}

export async function addPartnerId(sha256Email: string, partnerId: string): Promise<UserDetails | null> {
  const result = await sql`
    UPDATE user_details
    SET partner_ids = array_append(partner_ids, ${partnerId})
    WHERE sha256_email = ${sha256Email}
    AND NOT ${partnerId} = ANY(partner_ids)
    RETURNING user_id, sha256_email, partner_ids
  `;

  if (result.length > 0) {
    return {
      userId: result[0].user_id,
      sha256Email: result[0].sha256_email,
      partnerIds: result[0].partner_ids,
    };
  }

  return null;
}

export function hashEmail(email: string): string {
  return createHash('sha256')
    .update(email.toLowerCase())
    .digest('hex');
}

export function createPartnerId(provider: string, accountId: string): string {
  return createHash('sha256')
    .update(`${provider}-${accountId}`)
    .digest('hex');
} 