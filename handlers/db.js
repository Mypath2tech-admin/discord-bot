import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

export async function getDb() {
  if (!db) {
    await mongoClient.connect();
    db = mongoClient.db('economyBot');
  }
  return db;
}
export async function closeDb() {
  if (db) {
    await mongoClient.close();
    db = null;
  }
}