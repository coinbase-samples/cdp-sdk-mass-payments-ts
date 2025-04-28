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

// List of required environment variables
const requiredEnvVars = [
  // Database Configuration
  'DATABASE_URL',
  'NODE_ENV',

  // CDP Configuration
  'CDP_API_KEY_ID',
  'CDP_API_KEY_SECRET',
  'CDP_WALLET_SECRET',

  // Auth Configuration
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',

  // RPC Endpoint
  'BASE_SEPOLIA_NODE_URL',

  // Contract Addresses
  'GASLITE_DROP_ADDRESS',
] as const;

type EnvVar = typeof requiredEnvVars[number];

// Type for our environment variables
type EnvConfig = {
  [K in EnvVar]: string;
};

// Cache for validated config
let validatedConfig: EnvConfig | null = null;

// Validate environment variables
const validateEnv = (): EnvConfig => {
  // Return cached config if it exists
  if (validatedConfig) {
    return validatedConfig;
  }

  const missingVars: string[] = [];
  const config: Partial<EnvConfig> = {};

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      missingVars.push(envVar);
    } else {
      config[envVar] = value;
    }
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Cache the validated config
  validatedConfig = config as EnvConfig;
  return validatedConfig;
};

// Export validated config
export const config = validateEnv(); 
