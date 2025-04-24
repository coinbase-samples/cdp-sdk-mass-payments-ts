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
