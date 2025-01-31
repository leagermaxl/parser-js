import mongoose from 'mongoose';

const uri =
  'mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority';

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Connection error:', err));

const Schema = mongoose.Schema;

const allTargets = new Schema({
  orderNumbers: { orderId: Number, orderNum: Number },
  orderDate: Date,
  totalAmount: String,
  amoutWithCoupon: String,
  products: [
    {
      quantity: Number,
      name: String,
    },
  ],
  coupon: { discountPercent: String, code: String },
});

const Models = mongoose.model('allTargets', allTargets);

async function fetchAndSaveData() {
  const data = await FUNC_DATA();
  const newEntry = new Models(DATA);
  await newEntry.save();
  console.log('Data saved to MongoDB Atlas!');
}

fetchAndSaveData();
