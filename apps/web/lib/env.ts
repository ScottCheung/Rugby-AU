import path from 'node:path';
import { loadEnvConfig } from '@next/env';

/**
 * The repository has one .env.local at its root, but Next.js and the seed
 * script run from apps/web. Load the root file explicitly (existing
 * environment variables always win).
 */
export function loadRootEnv() {
  loadEnvConfig(
    path.resolve(process.cwd(), '../..'),
    process.env.NODE_ENV !== 'production',
  );
}
