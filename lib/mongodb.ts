import { MongoClient, Db } from 'mongodb';

// ⚠️  Do NOT throw at module-evaluation time — that crashes next build.
//     Defer the URI check until connectDB() is called at request time.
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'toofan';

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
}

// In development we reuse the connection across hot-reloads
const globalWithMongo = global as typeof global & { _mongoCache?: MongoCache };

const cached: MongoCache = globalWithMongo._mongoCache ?? { client: null, db: null };
if (!globalWithMongo._mongoCache) {
  globalWithMongo._mongoCache = cached;
}

export async function connectDB(): Promise<Db> {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (dev) or Vercel Environment Variables (production).'
    );
  }

  if (cached.client && cached.db) return cached.db;

  const client = new MongoClient(uri);
  await client.connect();
  cached.client = client;
  cached.db = client.db(dbName);
  return cached.db;
}
