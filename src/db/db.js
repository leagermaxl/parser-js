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

export async function statusFilteredDataToDB(targetStatus) {
  try {
    console.log('Orders in table ORDERS ', await Orders.find());

    const filtered = await Orders.find({ 'orderStatus.value': targetStatus });

    if (filtered.length === 0) {
      console.log('No orders in progress');
    }

    for (const order of filtered) {
      await OrdersInProgress.updateOne({ _id: order._id }, { $set: order }, { upsert: true });
    }
    console.log(`Сохранено ${filtered.length} заказов с статусом ${targetStatus}.`);
  } catch (e) {
    console.log(e.message);
  }
}

