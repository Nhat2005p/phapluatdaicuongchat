import mongoose from 'mongoose';
import { config } from './env.js';

let memoryServer: any = null;

export async function connectDB(): Promise<void> {
  try {
    // Attempt standard connection with 2s timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected successfully to: ${config.mongodbUri}`);
  } catch (err: any) {
    console.warn(`[MongoDB] Could not connect to primary URI (${config.mongodbUri}): ${err.message}`);
    console.log('[MongoDB] Initializing automated in-memory MongoDB fallback...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: { startupTimeout: 60000 } as any
      });
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[MongoDB] Running smoothly on Embedded In-Memory MongoDB: ${memUri}`);
    } catch (fallbackErr: any) {
      console.error('[MongoDB] Critical error starting fallback DB:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
