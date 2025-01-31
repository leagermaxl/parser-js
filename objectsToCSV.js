import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'orders.csv');

const orders = [
  {
    orderNumbers: { orderId: '19158', orderNum: '758382709' },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      {
        quantity: 2,
        name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.',
      },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      {
        quantity: 1,
        name: 'Бальзам для волос с комплексом аминокислот, 200 мл',
      },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
  {
    orderNumbers: { orderId: '19158', orderNum: '758382709' },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      {
        quantity: 2,
        name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.',
      },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      {
        quantity: 1,
        name: 'Бальзам для волос с комплексом аминокислот, 200 мл',
      },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
  {
    orderNumbers: { orderId: '19158', orderNum: '758382709' },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      {
        quantity: 2,
        name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.',
      },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      {
        quantity: 1,
        name: 'Бальзам для волос с комплексом аминокислот, 200 мл',
      },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
];

function convertToCSV(orders) {
  let csv =
    'Order ID, Order Number, Order Date, Total Amount, Amount With Coupon, Product Name, Quantity\n';

  orders.forEach((order) => {
    csv += `${order.orderNumbers.orderId},${order.orderNumbers.orderNum},${order.orderDate},${order.totalAmount},${order.amoutWithCoupon},`;
    order.products.map((product, index) => {
      csv +=
        index === 0
          ? `"${product.name}",${product.quantity}\n`
          : `"","","","","","${product.name}",${product.quantity}\n`;
    });
  });

  return csv;
}

async function saveCSV() {
  const csvData = convertToCSV(orders);
  const filePath = path.join(process.cwd(), 'orders.csv');

  const csvWithBOM = '\uFEFF' + csvData;

  try {
    await fs.writeFile(filePath, csvWithBOM, 'utf8');
    console.log(`✅ CSV-файл успешно создан: ${filePath}`);
  } catch (error) {
    console.error('❌ Ошибка при записи файла:', error);
  }
}

saveCSV();
