/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_AUTH0_CLIENT_ID: string
  readonly VITE_AUTH0_AUDIENCE: string
  readonly GEMINI_API_KEY: string
  readonly NODE_ENV: string
  readonly JWT_SECRET: string
  readonly DATABASE_URL: string
  readonly DB_HOST: string
  readonly DB_PORT: string
  readonly DB_USER: string
  readonly DB_PASSWORD: string
  readonly DB_NAME: string
  readonly AUTHORIZATION_SERVER: string
  readonly RESOURCE_URL: string
  readonly OAUTH_CLIENT_ID: string
  readonly OAUTH_CLIENT_SECRET: string
  readonly OAUTH_JWKS_URI: string
  readonly AUTH0_MANAGEMENT_API_TOKEN: string
  readonly AUTH0_DOMAIN: string
  readonly AUTH0_AUDIENCE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
