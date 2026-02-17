import path from 'path';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '.env.vite');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env': {
          GEMINI_API_KEY: env.GEMINI_API_KEY || '',
          NODE_ENV: env.NODE_ENV || 'development',
          JWT_SECRET: env.JWT_SECRET || '',
          DATABASE_URL: env.DATABASE_URL || '',
          DB_HOST: env.DB_HOST || '',
          DB_PORT: env.DB_PORT || '',
          DB_USER: env.DB_USER || '',
          DB_PASSWORD: env.DB_PASSWORD || '',
          DB_NAME: env.DB_NAME || '',
          AUTHORIZATION_SERVER: env.AUTHORIZATION_SERVER || '',
          RESOURCE_URL: env.RESOURCE_URL || '',
          OAUTH_CLIENT_ID: env.OAUTH_CLIENT_ID || '',
          OAUTH_CLIENT_SECRET: env.OAUTH_CLIENT_SECRET || '',
          OAUTH_JWKS_URI: env.OAUTH_JWKS_URI || '',
          AUTH0_MANAGEMENT_API_TOKEN: env.AUTH0_MANAGEMENT_API_TOKEN || '',
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
