import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.pg.ts',
  out: './drizzle/pg-migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://dealdoor:dealdoor@localhost:54329/dealdoor',
  },
});
