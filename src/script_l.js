import { createStyledExcel } from './utils/xlsx.js';
import { requestsForOrders } from './utils/utils.js';

const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const main = async () => {
  const orders = await requestsForOrders(urlPage, urlOrder);
  console.log('orders', orders);
  await createStyledExcel(orders);
};

main();
