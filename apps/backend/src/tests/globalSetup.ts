import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const VITEST_DIR = join(__dirname, '../../.vitest');
const URL_FILE = join(VITEST_DIR, 'postgres-url');

async function prepareDatabase(connectionString: string): Promise<void> {
  const backendRoot = join(__dirname, '../..');
  process.env.DATABASE_URL = connectionString;

  execSync('npx prisma db push --schema=./prisma/schema.prisma.postgres --accept-data-loss', {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  });

  execSync('npx prisma generate --schema=./prisma/schema.prisma.postgres', {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  });

  writeFileSync(URL_FILE, connectionString, 'utf-8');
}

export default async function globalSetup() {
  mkdirSync(VITEST_DIR, { recursive: true });

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (testDatabaseUrl) {
    await prepareDatabase(testDatabaseUrl);
    return;
  }

  let container;
  try {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();
  } catch {
    throw new Error(
      'Integration tests require Docker or TEST_DATABASE_URL. ' +
        'Start Docker Desktop or set TEST_DATABASE_URL to a PostgreSQL connection string.'
    );
  }

  await prepareDatabase(container.getConnectionUri());

  return async () => {
    await container.stop();
  };
}
