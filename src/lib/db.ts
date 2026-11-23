import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/motoplexbd";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastFailureTime: number;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
  lastFailureTime: 0,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

// 10-second cooldown after a failed connection attempt
const FAILURE_COOLDOWN_MS = 10_000;

async function connectDB(): Promise<typeof mongoose> {
  // 1. If connection already active, return immediately in 0ms
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If recent attempt failed, fail fast so fallback responses render cleanly
  if (Date.now() - cached.lastFailureTime < FAILURE_COOLDOWN_MS) {
    throw new Error("MongoDB offline (cooldown active)");
  }

  // 3. Initiate connection with resilient cloud timeout
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("[MongoDB] Connected successfully");
        cached.lastFailureTime = 0;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.lastFailureTime = Date.now();
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.lastFailureTime = Date.now();
    cached.promise = null;
    cached.conn = null;
    throw e;
  }
}

export default connectDB;
