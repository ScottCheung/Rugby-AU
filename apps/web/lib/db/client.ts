import { MongoClient, type Db } from 'mongodb';
import { loadRootEnv } from '../env';

loadRootEnv();

const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';

// One client per process. In development Next.js re-evaluates modules on
// every change, so the client is kept on globalThis to avoid leaking
// connections.
const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export async function getDb(): Promise<Db> {
  globalForMongo.mongoClientPromise ??= new MongoClient(uri).connect();
  const client = await globalForMongo.mongoClientPromise;
  // Read on each call, so tests can point at their own database.
  return client.db(process.env.MONGODB_DB ?? 'rugby_site_manager');
}

/** Only for scripts (the seed): lets the process exit. */
export async function closeDb() {
  const promise = globalForMongo.mongoClientPromise;
  globalForMongo.mongoClientPromise = undefined;
  if (promise) await (await promise).close();
}
