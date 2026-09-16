#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const backendRoot = path.resolve(workspaceRoot, 'backend');
const backendPrismaDir = path.resolve(backendRoot, 'node_modules/.prisma');

if (fs.existsSync(backendPrismaDir)) {
  fs.rmSync(backendPrismaDir, { recursive: true, force: true });
  console.log(`[prisma-reset] removed stale Prisma client cache: ${backendPrismaDir}`);
}

try {
  execSync('npx prisma generate --schema=./prisma/schema.prisma', {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
} catch (error) {
  console.error('[prisma-reset] Prisma generate failed.');
  process.exit(error.status ?? 1);
}
