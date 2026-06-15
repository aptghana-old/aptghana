import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Reuse connection across hot reloads in Next.js dev mode
const globalCache = global as typeof global & { mongoose?: MongooseCache };

if (!globalCache.mongoose) {
  globalCache.mongoose = { conn: null, promise: null };
}

const cache = globalCache.mongoose;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!cache.promise) {
    // L-14: Reduced pool size for serverless (Vercel) to prevent Atlas connection exhaustion.
    // 3 apps × N concurrent function instances × maxPoolSize must stay under Atlas M10 limit (512).
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands:          false,
        maxPoolSize:             5,   // down from 10 — safe for serverless concurrency
        minPoolSize:             0,   // release idle connections immediately
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS:         45000,
        connectTimeoutMS:        10000,
        maxIdleTimeMS:           30000, // release idle connections after 30s
      })
      .then((m) => {
        cache.conn = m;
        return m;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export { mongoose };
