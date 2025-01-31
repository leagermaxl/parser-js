import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { createStyledExcel } from './xlsx.js';
// import XLSX from 'xlsx';

//FETCH DATA

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

const processFetchData = async (path, linkMakr) => {
  let html = null;
  if (!linkMakr) html = await fs.readFile(path, 'utf-8');
  else html = await fetchData(path);

  // console.log('html', html);

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const tables = document.querySelectorAll('.shop2-order-table');
  // console.log(tables);

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
  // console.log('Обработанный заказ:\n', result);
  return result;
};

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

//PARSING DATA

function getCoupon(data) {
  const keys = Object.keys(data);
  const pattern = ['Сумма', 'Вес', 'Сумма со скидками', 'Доставка', 'Сумма к оплате'];

  const missingFields = keys
    .filter((key) => !pattern.includes(key))
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});

  return missingFields;
}

function parseCoupon(data) {
  const couponField = getCoupon(data);

  const couponKey = Object.keys(couponField)[0];
  if (!couponKey) return null;

  const couponInfo = couponField[couponKey];

  const percentMatch = couponInfo.match(/(\d+)\s*%/);
  const codeMatch = couponInfo.match(/\(Купон\s*\/\s*([^)]+)\)/);

  if (!percentMatch || !codeMatch) return null;

  return {
    discountPercent: percentMatch[1] + '%',
    code: codeMatch[1].trim(),
  };
}

function processOrderData(orderArray) {
  const couponField = parseCoupon(orderArray[3].data);

  const processedOrder = Object.assign({
    orderNumbers: {
      orderId: 0,
      orderNum: 0,
    },
    orderDate: '',
    totalAmount: '',
    amoutWithCoupon: '',
    products: [],
    coupon: null,
    // ERROR: null,
  });

  orderArray.forEach((item) => {
    const { data, OrberNumber, products } = item;

    if (OrberNumber) {
      const sep = OrberNumber.match(/^Заказ #(\d+)\((\d+)\)$/);
      processedOrder.orderNumbers.orderId = parseInt(sep[1]);
      processedOrder.orderNumbers.orderNum = parseInt(sep[2]);
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

    if (couponField) {
      processedOrder.coupon = couponField;
    }
  });

  return processedOrder;
}

const processFetchDataPages = async (path, isLink) => {
  let html = null;
  if (!isLink) html = await fs.readFile(path, 'utf-8');
  else html = await fetchData(path);

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const pages = parseInt(document.querySelector('.page-nums').textContent.trim().split(/\s+/)[1]);
  const orderIdsHTML = document.querySelectorAll('tr.order td.order-number span.objectAction');

  const orderIds = Array.from(orderIdsHTML).map((orderId) => {
    const order = orderId.textContent.replace(/[()]/g, '').split(/\s+/);
    return { orderNumber: order[0], orderId: order[1] };
  });

  return { pages, orderIds };
};

async function processOrders(orderIds, urlOrder) {
  const ordersData = [];
  for (let i = orderIds.length - 1; i >= 0; i--) {
    // for (let i = 0; i < Math.min(orderIds.length, 50); i++) {
    console.log('myCallback');
    const updatedUrl = urlOrder.replace(/(order_id=)\d+/, `$1${orderIds[i].orderId}`);
    // console.log(orderIds);
    console.log('[REQUEST TO]:', `${updatedUrl}`);

    ordersData.push(await processFetchData(updatedUrl, true));
    console.log('data', ordersData);

    if (i === orderIds.length - 4) return ordersData;

    const { max, min } = { max: 3000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    await new Promise((resolve) => setTimeout(resolve, randomInterval));
  }
  console.log('asdasdasdasd', ordersData);
  return ordersData;
}

async function requestsForOrders(urlPage, urlOrder) {
  console.log('requestsForOrders');
  let page = 2;
  const ordersData = [];

  // const { pages } = await processFetchDataPages(urlPage, true);
  const pages = 2;
  console.log(pages);

  while (page >= 0) {
    console.log('while');
    console.log('page', page);
    const updatedUrlPage = urlPage.replace(/(p=)\d+/, `$1${page}`);
    console.log(updatedUrlPage);

    const { orderIds } = await processFetchDataPages(updatedUrlPage, true);

    ordersData.push(...(await processOrders(orderIds, urlOrder)));

    page--;
  }
  console.log('ordersData', ordersData);
  return ordersData;
}

const aarrr = [{}, {}, {}, {}];

const arr = [764437709, 764401309, 764392909, 764389509, 764389109];
const urlPage =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';
const urlOrder =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view';

const obj = [
  {
    orderNumbers: { orderId: '19158', orderNum: '758382709' },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      {
        quantity: 2,
        name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.',
      },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      {
        quantity: 1,
        name: 'Бальзам для волос с комплексом аминокислот, 200 мл',
      },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
  {
    orderNumbers: { orderId: '19158', orderNum: '758382709' },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      {
        quantity: 2,
        name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.',
      },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      {
        quantity: 1,
        name: 'Бальзам для волос с комплексом аминокислот, 200 мл',
      },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
  {
    orderNumbers: { orderId: '19158', orderNum: '758382709' },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      {
        quantity: 2,
        name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.',
      },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      {
        quantity: 1,
        name: 'Бальзам для волос с комплексом аминокислот, 200 мл',
      },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
];

const main = async () => {
  const orders = await requestsForOrders(urlPage, urlOrder);
  console.log('orders', orders);
  await createStyledExcel(orders);
};

main();

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
