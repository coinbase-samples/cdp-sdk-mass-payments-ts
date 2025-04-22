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
