import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderId: Number,
    orderNum: Number,
    orderStatus: { value: Number, text: String },
    orderDate: Date,
    totalAmount: String,
    amountWithCoupon: String,
    products: [
      {
        quantity: Number,
        name: String,
        _id: false,
      },
    ],
    coupon: { discountPercent: String, code: String },
  },
  { versionKey: false },
);

export const Orders = mongoose.model('orderSchema ', orderSchema);
