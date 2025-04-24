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

const nonces = new Map<string, number>(); // nonce -> timestamp

export function storeNonce(nonce: string) {
  nonces.set(nonce, Date.now());
}

export function isValidNonce(nonce: string) {
  return nonces.has(nonce);
}

export function deleteNonce(nonce: string) {
  nonces.delete(nonce);
}

// Optionally: clean up old nonces (TTL of 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [nonce, time] of nonces.entries()) {
    if (now - time > 5 * 60 * 1000) nonces.delete(nonce);
  }
}, 60 * 1000); // run every 1 min
