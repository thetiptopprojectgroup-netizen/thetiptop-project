import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * Démarre une instance MongoDB en mémoire et connecte Mongoose.
 * À utiliser dans beforeAll des tests d’intégration API + persistance.
 */
export async function startMemoryMongo() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  return mongoServer;
}

export async function stopMemoryMongo(mongoServer) {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
