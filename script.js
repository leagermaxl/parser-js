import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

const fetchData = async (url) => {
  let dataResponse = '';
  try {
    const { data } = await axios.get(url, {
      headers: {
        Cookie: 'mcsid=1jEbjbY8slE0_rtYPMnUhRlFvaemtwcIQP80mrRl',
      },
    });
    dataResponse = data;
  } catch (error) {
    console.error(error);
  }
  return dataResponse;
};

function processOrderData(orderArray) {
  // console.log(Object.keys(orderArray[3].data)[2]);
  console.log(orderArray);
  const processedOrder = {
    orderNumbers: {
      orderId: '',
      orderNum: '',
    },
    orderDate: '',
    totalAmount: '',
    coupon: {
      code: '',
      discountPercent: '',
    },
    amoutWithCoupon: '',
    products: {},
  };

  orderArray.forEach((item) => {
    const { data, OrberNumber, products } = item;

    if (OrberNumber) {
      const sep = OrberNumber.match(/^Заказ #(\d+)\((\d+)\)$/);
      processedOrder.orderNumbers.orderId = sep[1];
      processedOrder.orderNumbers.orderNum = sep[2];
    }

    if (products) {
      processedOrder.products = products;
    }

    if (data['Дата заказа']) {
      processedOrder.orderDate = data['Дата заказа'];
    }

    if (data['Сумма']) {
      processedOrder.totalAmount = data['Сумма'];
    }

    if (data['Сумма к оплате']) {
      processedOrder.amoutWithCoupon = data['Сумма к оплате'];
    }

    // Получаем информацию о купоне и скидке
    if (data['curlegina']) {
      const couponInfo = data['curlegina'];
      const percentMatch = couponInfo.match(/(\d+)\s*%/);
      const codeMatch = couponInfo.match(/\(Купон\s*\/\s*([^)]+)\)/);

      if (percentMatch) {
        processedOrder.coupon.discountPercent = percentMatch[1] + '%';
      }
      if (codeMatch) {
        processedOrder.coupon.code = codeMatch[1].trim();
      }
    }
  });

  return processedOrder;
}

function getProducts(document, selector) {
  const rows = document.querySelectorAll(selector);

  const products = Array.from(rows)
    .filter((row) => row.querySelector('.product-name'))
    .map((row) => {
      const nameElement = row.querySelector('.product-name');
      const quantityCell = row.querySelector('td:nth-child(9)');

      const quantityText = quantityCell.textContent.trim();
      const quantity = parseFloat(quantityText.replace(/[^0-9.,]/g, ''));

      const prodname = nameElement.textContent.trim();

      return {
        quantity,
        name: prodname,
      };
    });

  // Убираем повторяющиеся названия (оставляем первый уникальный товар)
  const uniqueProducts = [];
  const seenNames = new Set();

  products.forEach((product) => {
    if (!seenNames.has(product.name)) {
      uniqueProducts.push(product);
      seenNames.add(product.name);
    }
  });

  /*console.log('Найденные товары:');
  uniqueProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.quantity} шт. - ${product.name}`);
  });*/

  return uniqueProducts;
}

const processFetchData = async (path, linkMakr) => {
  let html = null;
  if (!linkMakr) html = await fs.readFile(path, 'utf-8');
  else html = await fetchData(path);

  // console.log('html', html);

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const tables = document.querySelectorAll('.shop2-order-table');

  const OrderSelectedElement = document.querySelector('td.draggable_title span.title');
  const OrberNumber = OrderSelectedElement.textContent;

  const products = getProducts(document, 'tr:not(.view-hidden)');

  const tableData = Array.from(tables).map((table, index) => {
    const rows = table.querySelectorAll('tr');
    const data = {};

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 2) {
        const key = cells[0].textContent.trim();
        const value = cells[1].textContent.trim();
        data[key] = value;
      }
    });

    return {
      tableIndex: index + 1,
      data,
      OrberNumber,
      products,
    };
  });

  //console.log('Найденные таблицы:', tableData);

  const result = processOrderData(tableData);
  console.log('Обработанный заказ:\n', result);
};

function requestsForOrbers(arr, url) {
  let i = 0;

  function myCallback() {
    const updatedUrl = url.replace(/(order_id=)\d+/, `$1${arr[i]}`);
    console.log(updatedUrl);

    if (i === arr.length - 1) return;

    const { max, min } = { max: 5000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    setTimeout(myCallback, randomInterval);
    i++;
  }

  myCallback();
}

const arr = [
  841604243, 331592079, 266489755, 311793429, 198855081, 238066084, 532036913, 384277952, 209715332,
  497310205,
];
const url =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=763958109&act=view&rnd=559&xhr=1';

requestsForOrbers(arr, url);

const filePath = './HTML.html';
processFetchData(url, true);

// // Парсим HTML
// const parser = new DOMParser();
// const doc = parser.parseFromString(html, 'text/html');

// // Находим все таблицы с классом shop2-order-table
// const tables = doc.querySelectorAll('.shop2-order-table');

// // Собираем данные из всех таблиц
// const tableData = Array.from(tables).map((table, index) => {
//   const rows = table.querySelectorAll('tr');
//   const data = {};

//   rows.forEach((row) => {
//     const cells = row.querySelectorAll('td');
//     if (cells.length === 2) {
//       const key = cells[0].textContent.trim();
//       const value = cells[1].textContent.trim();
//       data[key] = value;
//     }
//   });

//   return {
//     tableIndex: index + 1, // Номер таблицы
//     data,
//   };
// });

// // Вывод всех таблиц в консоль
// console.log('Найденные таблицы:', tableData);

// function processOrderData(orderArray) {
//   // Создаем объект для хранения нужных данных
//   const processedOrder = {
//     orderNumber: '', // Номера заказа нет в исходных данных
//     orderDate: '',
//     totalAmount: '',
//     coupon: {
//       code: '',
//       discountPercent: '',
//     },
//     productName: '', // Названия товара нет в исходных данных
//   };

//   // Проходим по массиву и извлекаем нужные данные
//   orderArray.forEach((item) => {
//     const { data } = item;

//     // Получаем дату заказа
//     if (data['Дата заказа']) {
//       processedOrder.orderDate = data['Дата заказа'];
//     }

//     // Получаем сумму заказа (берём финальную сумму к оплате)
//     if (data['Сумма к оплате']) {
//       processedOrder.totalAmount = data['Сумма к оплате'];
//     }

//     // Получаем информацию о купоне и скидке
//     if (data['curlegina']) {
//       const couponInfo = data['curlegina'];
//       const percentMatch = couponInfo.match(/(\d+)\s*%/);
//       const codeMatch = couponInfo.match(/\(Купон\s*\/\s*([^)]+)\)/);

//       if (percentMatch) {
//         processedOrder.coupon.discountPercent = percentMatch[1] + '%';
//       }
//       if (codeMatch) {
//         processedOrder.coupon.code = codeMatch[1].trim();
//       }
//     }
//   });

//   return processedOrder;
// }

// // Пример использования:
// const result = processOrderData(tableData);
// console.log(result);
