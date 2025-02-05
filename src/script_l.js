import { connectToDatabase, fetchAndSaveDataToDB, statusFilteredDataToDB, disconnectFromDatabase, getAllFromDB} from './db/db.js';

import { requestsForOrders } from './utils/utils.js';
import { createStyledExcel } from './utils/xlsx.js';
import { createStyledExcel as createStyledExcelDynamic } from './utils/xlsx_dynamic.js';

const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

  async function filteredOrders(orders, couponName) {
    return orders
      .map(order => {
        // Если couponName пустой, возвращаем все заказы
        if (couponName === "") {
          return {
            "orderId": order.orderId,
            "orderNum": order.orderNum,
            "orderStatus": order.orderStatus.text,
            "orderDate": order.orderDate,
            "totalAmount": order.totalAmount,
            "amountWithCoupon": order.amountWithCoupon,
            "products": order.products,
            "coupon": order.coupon?.code 
              ? order.coupon.code.toLocaleLowerCase() + " " + order.coupon.discountPercent 
              : ""
          };
        }
  
        // Если couponName не пустой, фильтруем по нему
        if (order.coupon?.code && order.coupon.code.toLocaleLowerCase() === couponName) {
          return {
            "orderId": order.orderId,
            "orderNum": order.orderNum,
            "orderStatus": order.orderStatus.text,
            "orderDate": order.orderDate,
            "totalAmount": order.totalAmount,
            "amountWithCoupon": order.amountWithCoupon,
            "products": order.products,
            "coupon": order.coupon.code.toLocaleLowerCase() + " " + order.coupon.discountPercent
          };
        }
  
        return null; 
      })
      .filter(order => order !== null); 
  }
  
  async function getCouponNames(orders) {
    const names = new Set();
    names.add("");
    orders.forEach(order => {
      if (order.coupon?.code) {
        names.add(order.coupon.code.toLocaleLowerCase());
      }
    });
    return Array.from(names); // Преобразуем Set в массив для удобства
  }
  
  const main = async () => {
    const filePath = 'bloggers/orders_';
  
    try {
      await connectToDatabase();
      const orders = await getAllFromDB();     
      let couponNames = await getCouponNames(orders);
      
      for (const name of couponNames) {
        const filtered = await filteredOrders(orders, name);
        const pathSrc = `${filePath}${name}.xlsx`;
        await createStyledExcelDynamic(filtered, pathSrc);
      }
    } catch (error) {
      console.error('Произошла ошибка:', error);
    } finally {
      await disconnectFromDatabase();
    }
  };
