import fs from 'fs/promises';
import path from 'path';
import { createStyledExcel } from './xlsx.js';
import {processFetchData, processFetchDataPages} from "./parser/parserUtils.js"



async function processOrders(orderIds, urlOrder) {
  const ordersData = [];
  for (let i = 0; i < Math.min(orderIds.length, 2); i++) {
    console.log('myCallback');
    const updatedUrl = urlOrder.replace(/(order_id=)\d+/, `$1${orderIds[i].orderId}`);
    console.log('[REQUEST TO]:', `${updatedUrl}`);

    ordersData[i] = await processFetchData(updatedUrl, true);

    console.log(ordersData[i]);

    if (i === orderIds.length - 1) return;

    const { max, min } = { max: 5000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    await new Promise((resolve) => setTimeout(resolve, randomInterval));
  }
  return ordersData;
}

async function requestsForOrders(urlPage, urlOrder) {
  console.log('requestsForOrders');
  let page = 0;
  const ordersData = [];

  // const { pages } = await processFetchDataPages(urlPage, true);
  const pages = 2;
  console.log(pages);

  while (page < pages) {
    console.log('while');
    console.log('page', page);
    const updatedUrlPage = urlPage.replace(/(p=)\d+/, `$1${page}`);
    console.log(updatedUrlPage);

    const { orderIds } = await processFetchDataPages(updatedUrlPage, true);

    ordersData.push(...(await processOrders(orderIds, urlOrder)));

    page++;
  }
  return ordersData;
}

function convertToCSV(orders) {
  let csv =
    'Order ID;Order Number;Order Date;Total Amount;Amount With Coupon;Coupon;Product Name;Quantity\n';

  orders.forEach((order) => {
    csv += `${order.orderNumbers.orderId};${order.orderNumbers.orderNum};${order.orderDate};${
      order.totalAmount
    };${order.amoutWithCoupon};${order.coupon?.code.toLowerCase()};`;
    order.products.map((product, index) => {
      csv +=
        index === 0
          ? `${product.name};${product.quantity}\n`
          : `"";"";"";"";"";"";"${product.name}";${product.quantity}\n`;
    });
  });

  return csv;
}

async function saveCSV(orders) {
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


const arr = [764437709, 764401309, 764392909, 764389509, 764389109];
const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const obj = [
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

const main = async () => {
  const orders = await requestsForOrders(urlPage, urlOrder);
  console.log("orders", orders);
  await createStyledExcel(orders);
};

main();
