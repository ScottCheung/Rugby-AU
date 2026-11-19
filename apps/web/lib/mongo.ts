import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB ?? 'rugby_site_manager';

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
  mongoConnect?: Promise<MongoClient>;
};

export async function getDatabase() {
  const client = globalForMongo.mongoClient ?? new MongoClient(uri);
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = client;
    globalForMongo.mongoConnect = client.connect();
  }
  await globalForMongo.mongoConnect;
  return client.db(dbName);
}
