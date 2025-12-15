import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('Missing MONGODB_URI in environment variables');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (globalThis as any).mongoose;

if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(uri as string, {
                bufferCommands: false
            })
            .then((mongoose) => mongoose)
            .catch((err) => {
                console.error('MongoDB connection failed:', err);
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
