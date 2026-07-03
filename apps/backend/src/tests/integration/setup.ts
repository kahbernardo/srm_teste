import { beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createPostgresClient,
  PrismaClient,
} from './prisma-test-client';

const URL_FILE = join(__dirname, '../../../.vitest/postgres-url');

declare global {
  // eslint-disable-next-line no-var
  var __TEST_PRISMA__: PrismaClient | undefined;
}

let testPrisma: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    const databaseUrl = readFileSync(URL_FILE, 'utf-8').trim();
    testPrisma = createPostgresClient(databaseUrl);
    globalThis.__TEST_PRISMA__ = testPrisma;
  }
  return testPrisma;
}

export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.pricingStrategy.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.currency.deleteMany();
}

beforeAll(async () => {
  getTestPrisma();
});

afterAll(async () => {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = undefined;
    globalThis.__TEST_PRISMA__ = undefined;
  }
});
