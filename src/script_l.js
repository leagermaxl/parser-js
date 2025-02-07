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

const main = async () => {
  // await connectToDatabase();
  const lastOrderId = await readLastOrderIdFromFile('config.txt');

  const orders = await requestsForOrders(urlPage, urlOrder, lastOrderId);

  // console.log('orders', orders);

  const groupedOrders = await groupingOrdersByCoupon(orders);
  console.log(groupedOrders);
  console.log(Object.keys(groupedOrders));

  for (const couponCode of Object.keys(groupedOrders)) {
    groupedOrders[couponCode].amountEntire = groupedOrders[couponCode].reduce(
      (acc, order) => acc + order.amountPayment,
      0,
    );
    console.log(groupedOrders);
    await createStyledExcel(couponCode, groupedOrders[couponCode]);
  }
  writeLastOrderIdToFile('config.txt', orders[orders.length - 1].orderId);

  // Object.keys(groupedOrders).forEach((couponCode) => {
  //   createStyledExcel(couponCode, groupedOrders[couponCode]);
  //   // console.log(key, groupedOrders[couponCode].length);
  // });
  // await createStyledExcel(orders);

  // //DB
  // await fetchAndSaveDataToDB(orders);
  // await statusFilteredDataToDB(2);
  // await  disconnectFromDatabase();

  //FILE
  // await createStyledExcel(orders);
  // await createStyledExcelDynamic(orders);
};

main();
