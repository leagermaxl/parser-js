import axios from 'axios';
import { JSDOM } from 'jsdom';

const fetchData = async () => {
  let dataResponse = '';
  try {
    const { data } = await axios.get(
      'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?ver_id=1586314&access=u%3B1623555&shop_id=4373441&order_id=9109509&act=view&rnd=559&xhr=1',
      {
        headers: {
          Cookie: 'mcsid=1jEbjbY8slE0_rtYPMnUhRlFvaemtwcIQP80mrRl',
        },
      }
    );
    dataResponse = data;
    // console.log(data);
    // return data;
  } catch (error) {
    console.error(error);
  }
  // console.log('dataResponse', dataResponse);
  return dataResponse;
};

// fetchData();

const processFetchData = async () => {
  const html = await fetchData();
  // console.log('html', html);

  // Создаем виртуальный DOM
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Находим все таблицы с классом shop2-order-table
  const tables = document.querySelectorAll('.shop2-order-table');

  // Собираем данные из всех таблиц
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
      tableIndex: index + 1, // Номер таблицы
      data,
    };
  });

  // Вывод всех таблиц в консоль
  console.log('Найденные таблицы:', tableData);

  // Обработка данных заказов
  function processOrderData(orderArray) {
    // Создаем объект для хранения нужных данных
    const processedOrder = {
      orderNumber: '', // Номера заказа нет в исходных данных
      orderDate: '',
      totalAmount: '',
      coupon: {
        code: '',
        discountPercent: '',
      },
      productName: '', // Названия товара нет в исходных данных
    };

    // Проходим по массиву и извлекаем нужные данные
    orderArray.forEach((item) => {
      const { data } = item;

      // Получаем дату заказа
      if (data['Дата заказа']) {
        processedOrder.orderDate = data['Дата заказа'];
      }

      // Получаем сумму заказа (берём финальную сумму к оплате)
      if (data['Сумма к оплате']) {
        processedOrder.totalAmount = data['Сумма к оплате'];
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

  // Пример использования:
  const result = processOrderData(tableData);
  console.log('Обработанный заказ:', result);
};

processFetchData();

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
