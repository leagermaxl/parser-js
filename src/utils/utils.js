import { processFetchData, processFetchOrders } from '../parser/parserUtils.js';

export async function processOrders(orderIds, urlOrder) {
  const ordersData = [];
  for (let i = orderIds.length - 1; i >= 0; i--) {
    // for (let i = 0; i < Math.min(orderIds.length, 50); i++) {
    console.log('myCallback');
    const updatedUrl = urlOrder.replace(/(order_id=)\d+/, `$1${orderIds[i].orderId}`);
    console.log('[REQUEST TO]:', `${updatedUrl}`);

    ordersData.push(await processFetchData(updatedUrl, true));

    if (i === orderIds.length - 3) return ordersData;

    const { max, min } = { max: 3000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    await new Promise((resolve) => setTimeout(resolve, randomInterval));
  }
  return ordersData;
}

export async function requestsForOrders(urlPage, urlOrder, lastOrderIdDB) {
  let pages = 0;

  while (
    (await processFetchOrders(urlPage.replace(/(p=)\d+/, `$1${pages}`), true, lastOrderIdDB)) ==
    null
  ) {
    pages++;
    console.log(pages);
  }
  let page = pages;
  const ordersData = [];

  while (page >= 0) {
    console.log('while');
    console.log('page', page);
    const updatedUrlPage = urlPage.replace(/(p=)\d+/, `$1${page}`);
    console.log(updatedUrlPage);

    let orderIds;
    if (ordersData.length === 0) {
      orderIds = await processFetchOrders(updatedUrlPage, true, lastOrderIdDB);
    } else {
      orderIds = await processFetchOrders(updatedUrlPage, true);
    }
    // console.log('orderIds', orderIds[0]);

    ordersData.push(...(await processOrders(orderIds, urlOrder)));

    page--;
  }
  console.log('ordersData', ordersData);
  return ordersData;
}
