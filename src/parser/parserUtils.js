import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { fetchData } from '../fetch/fetchUtils.js';

export const processFetchData = async (path, isLink) => {
  let html = null;
  if (!isLink) html = await fs.readFile(path, 'utf-8');
  else html = await fetchData(path);
  
  // console.log('html', html);

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const tables = document.querySelectorAll('.shop2-order-table');
  // console.log(tables);

  const OrderSelectedElement = document.querySelector('td.draggable_title span.title');
  const OrderNumber = OrderSelectedElement.textContent;

  const orderStatus = getOrderStatus(document, '#order_status_style');

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
      OrderNumber: OrderNumber,
      orderStatus,
      products,
    };
  });

  //console.log('Найденные таблицы:', tableData);

  const result = processOrderData(tableData);
  console.log('Обработанный заказ:\n', result);
  return result;
};

function getOrderStatus(document, selector) {
  const selectedField = document.querySelector(selector);
  const selectedOption = selectedField.options[selectedField.selectedIndex];
  return {
    value: parseInt(selectedOption.value),
    text: selectedOption.textContent.trim(),
  };
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

      const productName = nameElement.textContent.trim();

      return {
        quantity,
        name: productName,
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
    orderId: 0,
    orderNum: 0,
    orderStatus: {},
    orderDate: null,
    totalAmount: '',
    amountWithCoupon: '',
    products: [],
    coupon: null,
    // ERROR: null,
  });

  orderArray.forEach((item) => {
    const { data, OrderNumber, products, orderStatus } = item;

    if (OrderNumber) {
      const sep = OrderNumber.match(/^Заказ #(\d+)\((\d+)\)$/);
      processedOrder.orderId = parseInt(sep[1]);
      processedOrder.orderNum = parseInt(sep[2]);
    }

    if (orderStatus) {
      processedOrder.orderStatus = orderStatus;
    }

    if (products) {
      processedOrder.products = products;
    }
      
    if (data['Дата заказа']) {
      processedOrder.orderDate = new Date(data['Дата заказа']);
    }
    
    if (data['Сумма']) {
      processedOrder.totalAmount = data['Сумма'];
    }

    if (data['Сумма к оплате']) {
      processedOrder.amountWithCoupon = data['Сумма к оплате'];
    }

    if (couponField) {
      processedOrder.coupon = couponField;
    }
  });
  return processedOrder;
}

export const processFetchOrders = async (path, isLink, lastOrderIdDB) => {
  let html = null;
  if (!isLink) html = await fs.readFile(path, 'utf-8');
  else html = await fetchData(path);

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const orderIdsHTML = document.querySelectorAll('tr.order td.order-number span.objectAction');

  const orderIds = [];
  const hasOrder = Array.from(orderIdsHTML).some((orderId) => {
    const order = orderId.textContent.replace(/[()]/g, '').split(/\s+/);

    if (parseInt(order[0]) === lastOrderIdDB) return true;

    orderIds.push({ orderNumber: order[0], orderId: order[1] });
  });
  // console.log(hasOrder);
  // console.log(orderIds);
  return hasOrder ? orderIds : lastOrderIdDB ? null : orderIds;
};