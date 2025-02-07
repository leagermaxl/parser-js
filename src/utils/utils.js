import fs from 'fs/promises';
import { processFetchData, processFetchOrders } from '../parser/parserUtils.js';

export async function processOrders(orderIds, urlOrder) {
  const ordersData = [];

  for (let i = orderIds.length - 1; i >= 0; i--) {
    // for (let i = 0; i < Math.min(orderIds.length, 50); i++) {
    const updatedUrl = urlOrder.replace(/(order_id=)\d+/, `$1${orderIds[i].orderNum}`);
    // console.log('[REQUEST TO]:', `${updatedUrl}`);
    console.log('Достаем информацию заказа', `${orderIds[i].orderId}`);

    ordersData.push(await processFetchData(updatedUrl, true));

    if (i === orderIds.length - 50) return ordersData;

    const { max, min } = { max: 3000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    await new Promise((resolve) => setTimeout(resolve, randomInterval));
  }
  return ordersData;
}

export async function requestsForOrders(urlPage, urlOrder, lastOrderIdDB) {
  let pages = 0;
  console.log('Ищем последний заказ на странице ', pages + 1);
  while (
    (await processFetchOrders(urlPage.replace(/(p=)\d+/, `$1${pages}`), true, lastOrderIdDB)) ==
    null
  ) {
    pages++;
    console.log('Ищем последний заказ на странице ', pages + 1);
  }
  let page = pages;
  const ordersData = [];

  while (page >= 0) {
    console.log('Достаем товары со страницы ', page + 1);
    const updatedUrlPage = urlPage.replace(/(p=)\d+/, `$1${page}`);
    // console.log(updatedUrlPage);

    let orderIds;
    if (ordersData.length === 0) {
      orderIds = await processFetchOrders(updatedUrlPage, true, lastOrderIdDB);
    } else {
      orderIds = await processFetchOrders(updatedUrlPage, true);
    }

    ordersData.push(...(await processOrders(orderIds, urlOrder)));

    page--;
  }
  // console.log('ordersData', ordersData);
  return ordersData;
}

export async function groupingOrdersByCoupon(orders) {
  const groupedOrders = orders
    .filter((order) => order.coupon && order.coupon.code)
    .reduce((acc, order) => {
      const couponCode = order.coupon.code.toLowerCase();
      if (!acc[couponCode]) acc[couponCode] = [];

      acc[couponCode].push(order);
      return acc;
    }, {});
  return groupedOrders;
}

export async function readLastOrderIdFromFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const number = parseFloat(data.replace(/\s+/g, ''));
    if (isNaN(number)) throw new Error('Файл не содержит число!');
    console.log('Id последнего заказа:', number);
    return number;
  } catch (error) {
    console.error('Ошибка чтения файла:', error);
  }
}

export async function writeLastOrderIdToFile(filePath, number) {
  try {
    await fs.writeFile(filePath, number.toString(), 'utf-8');
    console.log(`Id следующего заказа ${number} записано в файл: ${filePath}`);
  } catch (error) {
    console.error('Ошибка записи файла:', error);
  }
}
