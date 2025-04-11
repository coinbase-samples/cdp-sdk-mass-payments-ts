import { importJWK, JWTPayload, SignJWT } from "jose";
import { config } from '../config';

const keyName = config.CDP_API_KEY_NAME;
const keySecret = config.CDP_API_KEY_PRIVATE_KEY;

export type CDPFetchRequestParams = {
  requestMethod: 'GET' | 'POST';
  requestPath: string;
  body?: string;
  host?: string;
}

export async function fetchCdpEndpoint({
  requestMethod,
  requestPath,
  host = 'api.cdp.coinbase.com',
  body,
}: CDPFetchRequestParams) {
  const url = `https://${host}${requestPath}`;

  const urlObject = new URL(url);
  const uri = `${requestMethod} ${urlObject.host}${urlObject.pathname}`;
  const now = Math.floor(Date.now() / 1000);
  const claims: JWTPayload = {
    sub: keyName,
    iss: "cdp",
    aud: ["cdp_service"],
    uris: [uri],
  };

  const jwt = await buildEdwardsJWT(claims, now)

  try {
    return fetch(url, {
      method: requestMethod,
      body: body,
      headers: {
        Authorization: 'Bearer ' + jwt,
        "Content-Type": "application/json"
      },
    })
  } catch (error) {
    throw new Error(`Failed to fetch CDP endpoint: ${error}`);
  }
}

/**
   * Builds a JWT using an Ed25519 key.
   *
   * @param {JWTPayload} claims - The JWT claims.
   * @param {number} now - The current timestamp (in seconds).
   * @returns {Promise<string>} A JWT token signed with an Ed25519 key.
   */
async function buildEdwardsJWT(claims: JWTPayload, now: number): Promise<string> {
  // Expect a base64 encoded 64-byte string (32 bytes seed + 32 bytes public key)
  const decoded = Buffer.from(keySecret, "base64");
  if (decoded.length !== 64) {
    throw new Error("Could not parse the private key");
  }
  const seed = decoded.subarray(0, 32);
  const publicKey = decoded.subarray(32);
  const jwk = {
    kty: "OKP",
    crv: "Ed25519",
    d: seed.toString("base64url"),
    x: publicKey.toString("base64url"),
  };
  let key;
  try {
    key = await importJWK(jwk, "EdDSA");
  } catch (error) {
    throw new Error("Could not import the Ed25519 private key");
  }
  try {
    return await new SignJWT(claims)
      .setProtectedHeader({ alg: "EdDSA", kid: keyName, typ: "JWT", nonce: nonce() })
      .setIssuedAt(now)
      .setNotBefore(now)
      .setExpirationTime(now + 60)
      .sign(key);
  } catch (err) {
    throw new Error("Could not sign the JWT with the Ed25519 key");
  }
}

/**
   * Generates a random nonce for the JWT.
   *
   * @returns {string} The generated nonce.
   */
function nonce(): string {
  const range = "0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += range.charAt(Math.floor(Math.random() * range.length));
  }
  return result;
}

