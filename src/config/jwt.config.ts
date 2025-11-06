import { JwtModuleOptions } from '@nestjs/jwt';
import { loadConfig } from './env.config';

const config = loadConfig();

export const jwtConfig: JwtModuleOptions = {
  secret: config?.JWT_SECRET || 'your-secret-key',
  signOptions: {
    expiresIn: (config?.JWT_EXPIRES_IN || '24h') as any,
  },
};
