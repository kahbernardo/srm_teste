import { PrismaClient } from '../../../node_modules/.prisma/client-postgres';

export { PrismaClient };

export function createPostgresClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}
