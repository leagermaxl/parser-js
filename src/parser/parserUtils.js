import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { fetchData } from '../fetch/fetchUtils.js';

export const processFetchData = async (path, linkMakr) => {
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
  console.log('Обработанный заказ:\n', result);
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

export function processOrderData(orderArray) {
  const couponField = parseCoupon(orderArray[3].data);

  const processedOrder = Object.assign({
    orderNumbers: {
      orderId: '',
      orderNum: '',
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

    if (couponField) {
      processedOrder.coupon = couponField;
    }
  });


  return processedOrder;
}

export const processFetchDataPages = async (path, isLink) => {
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
