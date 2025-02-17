import {
  filteringOrdersInProgress,
  groupingOrdersByCoupon,
  readArrayFromJson,
  requestsForOrders,
  requestsForOrdersByArray,
  writeArrayInJson,
} from './utils/utils.js';
import { createStyledExcel } from './utils/xlsx.js';

const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const pathFileConfig = 'config.json';

const main = async () => {
  const orders = [];

  const dataFromConfig = await readArrayFromJson(pathFileConfig);

  if (dataFromConfig.ordersInProgress.length > 0) {
    const ordersByArray = await requestsForOrdersByArray(
      urlPage,
      urlOrder,
      dataFromConfig.ordersInProgress,
    );
    orders.push(...ordersByArray);
  }

  const ordersFromLastOrderId = await requestsForOrders(
    urlPage,
    urlOrder,
    dataFromConfig.lastOrderId,
  );
  orders.push(...ordersFromLastOrderId);
  await createStyledExcel('all', orders);

  const inProgressOrders = await filteringOrdersInProgress(orders);

  const groupedOrders = await groupingOrdersByCoupon(orders);

  for (const couponCode of Object.keys(groupedOrders)) {
    groupedOrders[couponCode].amountEntire = groupedOrders[couponCode]
      .filter((order) => order.orderStatus.value === 3)
      .reduce((acc, order) => acc + order.amountPayment, 0);

    await createStyledExcel(couponCode, groupedOrders[couponCode]);
  }

  await writeArrayInJson(pathFileConfig, {
    lastOrderId: orders[orders.length - 1].orderId + 1,
    ordersInProgress: inProgressOrders.reverse(),
  });
};

main();
