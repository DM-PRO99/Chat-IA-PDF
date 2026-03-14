import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongoose:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI: string = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI.trim()) {
  throw new Error("Missing MONGODB_URI in environment variables.");
}

if (!global.__mongoose) {
  global.__mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global.__mongoose?.conn) return global.__mongoose.conn;

  if (!global.__mongoose?.promise) {
    global.__mongoose = global.__mongoose ?? { conn: null, promise: null };
    global.__mongoose.promise = mongoose.connect(MONGODB_URI);
  }

  const conn = await global.__mongoose.promise;
  global.__mongoose.conn = conn;
  return conn;
}

