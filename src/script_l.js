import {
  groupingOrdersByCoupon,
  readLastOrderIdFromFile,
  requestsForOrders,
  writeLastOrderIdToFile,
} from './utils/utils.js';
import { createStyledExcel } from './utils/xlsx.js';

const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const pathFileConfig = 'config.txt';

const main = async () => {
  const lastOrderId = await readLastOrderIdFromFile(pathFileConfig);

  const orders = await requestsForOrders(urlPage, urlOrder, lastOrderId);

  const groupedOrders = await groupingOrdersByCoupon(orders);

  for (const couponCode of Object.keys(groupedOrders)) {
    groupedOrders[couponCode].amountEntire = groupedOrders[couponCode].reduce(
      (acc, order) => acc + order.amountPayment,
      0,
    );

    await createStyledExcel(couponCode, groupedOrders[couponCode]);
  }
  writeLastOrderIdToFile(pathFileConfig, orders[orders.length - 1].orderId + 1);
};

main();
