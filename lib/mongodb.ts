import { MongoClient, Db } from 'mongodb';

// ⚠️  Do NOT throw at module-evaluation time — that crashes next build.
//     Defer the URI check until connectDB() is called at request time.
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'toofan';

interface MongoCache {
  conn: Promise<Db> | null;
}

// In development we reuse the connection across hot-reloads
const globalWithMongo = global as typeof global & { _mongoCache?: MongoCache };

const cached: MongoCache = globalWithMongo._mongoCache ?? { conn: null };
if (!globalWithMongo._mongoCache) {
  globalWithMongo._mongoCache = cached;
}

export async function connectDB(): Promise<Db> {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (dev) or Vercel Environment Variables (production).'
    );
  }

  if (cached.conn) return cached.conn;

  const client = new MongoClient(uri, {
    maxPoolSize: 1, // Fix: prevent idle sockets from being silently dropped by Atlas
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 10000,
    family: 4, // Force IPv4 to prevent Node DNS resolution bugs
  });

  cached.conn = client.connect()
    .then(c => c.db(dbName))
    .catch(err => {
      cached.conn = null;
      throw err;
    });
  return cached.conn;
}
