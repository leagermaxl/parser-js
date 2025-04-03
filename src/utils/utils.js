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

    const { max, min } = { max: 2000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    await new Promise((resolve) => setTimeout(resolve, randomInterval));
  }
  return ordersData;
}

export async function requestsForOrders(urlPage, urlOrder, lastOrderIdDB) {
  let pages = 0;
  console.log('Ищем последний заказ на странице', pages + 1);
  while (
    (await processFetchOrders(urlPage.replace(/(p=)\d+/, `$1${pages}`), true, lastOrderIdDB)) ==
    null
  ) {
    pages++;
    console.log('Ищем последний заказ на странице', pages + 1);
  }
  let page = pages;
  const ordersData = [];

  while (page >= 0) {
    console.log('Достаем заказы со страницы', page + 1);
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

export async function requestsForOrdersByArray(urlPage, urlOrder, ordersInProgress) {
  let pages = 0;
  console.log('Ищем заказы "в работе" на странице', pages + 1);
  while (
    (await processFetchOrders(
      urlPage.replace(/(p=)\d+/, `$1${pages}`),
      true,
      ordersInProgress[0].orderId,
    )) == null
  ) {
    pages++;
    console.log('Ищем заказы "в работе" на странице', pages + 1);
  }
  let page = pages;
  const ordersData = [];

  while (page >= 0) {
    console.log('Достаем заказы "в работе" со страницы', page + 1);
    const updatedUrlPage = urlPage.replace(/(p=)\d+/, `$1${page}`);
    // console.log(updatedUrlPage);

    const orderIds = await processFetchOrders(updatedUrlPage, true, ordersInProgress[0].orderId);

    const ordersIdsInProgress = [];

    if (orderIds) {
      ordersInProgress.some((order) => {
        const orderFind = orderIds.find((ord) => parseInt(ord.orderId) === order.orderId);
        if (orderFind) ordersIdsInProgress.push(orderFind);
        else return true;
      });
    }
    // console.log(ordersIdsInProgress);
    if (ordersIdsInProgress.length > 0) {
      ordersInProgress.splice(0, ordersIdsInProgress.length);

      ordersData.push(...(await processOrders(ordersIdsInProgress, urlOrder)));
    }
    if (ordersInProgress.length <= 0) return ordersData;
    // console.log('ordersInProgress', ordersInProgress);

    page--;
  }
  // console.log('ordersData', ordersData);
  return ordersData;
}

export async function groupingOrdersByCoupon(orders) {
  const groupedOrders = orders
    .filter((order) => order.coupon && order.coupon.code && order.orderStatus.value !== 4)
    .reduce((acc, order) => {
      const couponCode = order.coupon.code.toLowerCase();
      if (!acc[couponCode]) acc[couponCode] = [];

      acc[couponCode].push(order);
      return acc;
    }, {});
  return groupedOrders;
}

export async function filteringOrdersInProgress(orders) {
  const inProgressOrders = [];
  // const inProgressOrders = orders.filter((order) => order.orderStatus.value === 2);
  orders.forEach((order) => {
    if (order.orderStatus.value === 2 || order.orderStatus.value === 1) {
      inProgressOrders.push({ orderId: order.orderId, orderNum: order.orderNum });
    }
  });

  return inProgressOrders;
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
export async function readArrayFromJson(filePath) {
  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    const orders = JSON.parse(rawData);
    console.log('Id последнего заказа:', orders.lastOrderId);
    console.log('Заказы "в работе" считаны из файла в количестве:', orders.ordersInProgress.length);
    return orders;
  } catch (error) {
    console.error('Ошибка чтения файла:', error);
  }
}

export async function writeArrayInJson(filePath, array) {
  try {
    const jsonData = JSON.stringify(array, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
    console.log(`Заказы "в работе" сохранены в файл: ${filePath}`);
  } catch (error) {
    console.error('Ошибка записи файла:', error);
  }
}
