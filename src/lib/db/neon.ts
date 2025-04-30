import { neon, neonConfig } from '@neondatabase/serverless';
import { config } from '@/lib/config';

if (config.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] = host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
    return `${protocol}://${host}:${port}/sql`;
  };
}

export const sql = neon(config.DATABASE_URL);