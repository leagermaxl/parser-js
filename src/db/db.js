import 'dotenv/config';
import mongoose from 'mongoose';
import { Orders } from './default_model.js';

const uri = process.env.MONGO_URI;
console.log(uri);

export async function connectToDatabase() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Connection error:', err);
  }
}

export async function fetchAndSaveDataToDB(data) {
  const newEntry = await Orders.insertMany(data);
  console.log('Data saved to MongoDB Atlas!', newEntry);
}
