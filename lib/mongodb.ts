import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'toofan';

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
}

// In development we reuse the connection across hot-reloads
const globalWithMongo = global as typeof global & { _mongoCache?: MongoCache };

let cached: MongoCache = globalWithMongo._mongoCache ?? { client: null, db: null };
if (!globalWithMongo._mongoCache) {
  globalWithMongo._mongoCache = cached;
}

export async function connectDB(): Promise<Db> {
  if (cached.client && cached.db) return cached.db;

  const client = new MongoClient(uri);
  await client.connect();
  cached.client = client;
  cached.db = client.db(dbName);
  return cached.db;
}
