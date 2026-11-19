import type { NextConfig } from 'next';
import { loadRootEnv } from './lib/env';

loadRootEnv();

const nextConfig: NextConfig = {};

export default nextConfig;
