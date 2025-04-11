// List of required environment variables
const requiredEnvVars = [
  // Database Configuration
  'MONGODB_URI',
  'MONGODB_DB_NAME',

  // CDP Configuration
  'CDP_API_KEY_ID',
  'CDP_API_KEY_SECRET',
  'CDP_WALLET_SECRET',
  'CDP_API_KEY_PRIVATE_KEY',
  'CDP_API_KEY_NAME',
] as const;

type EnvVar = typeof requiredEnvVars[number];

// Type for our environment variables
type EnvConfig = {
  [K in EnvVar]: string;
};

// Validate environment variables
const validateEnv = (): EnvConfig => {
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

  return config as EnvConfig;
};

// Export validated config
export const config = validateEnv(); 