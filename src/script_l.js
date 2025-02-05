import { connectToDatabase, fetchAndSaveDataToDB, statusFilteredDataToDB, disconnectFromDatabase} from './db/db.js';
import { requestsForOrders } from './utils/utils.js';
import { createStyledExcel } from './utils/xlsx.js';
import { createStyledExcel as createStyledExcelDynamic } from './utils/xlsx_dynamic.js';

const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const main = async () => {
  await connectToDatabase();
  const orders = await requestsForOrders(urlPage, urlOrder, 19370);
  console.log('orders', orders);
  //DB
  await fetchAndSaveDataToDB(orders);
  await statusFilteredDataToDB(2);
  await  disconnectFromDatabase();

  //FILE
  await createStyledExcel(orders);
  await createStyledExcelDynamic(orders);
  

};

main();

