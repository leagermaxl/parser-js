import { requestsForOrders } from './utils/utils.js';
import { createStyledExcel } from './utils/xlsx.js';
import { connectToDatabase, fetchAndSaveDataToDB } from './db/db.js';

const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const main = async () => {
  await connectToDatabase();
  const orders = await requestsForOrders(urlPage, urlOrder);
  console.log('orders', orders);
  await createStyledExcel(orders);
  fetchAndSaveDataToDB(orders);
};

main();
