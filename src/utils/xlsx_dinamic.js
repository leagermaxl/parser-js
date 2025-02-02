import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = 'orders_1.xlsx';

// Функция для получения всех уникальных полей из объектов
function getAllFields(orders) {
  const fields = new Set();

  orders.forEach((order) => {
    // Добавляем поля из корневого уровня
    Object.keys(order).forEach((key) => {
      if (key !== 'products') fields.add(key); // Исключаем 'products', так как это массив
    });

    // Добавляем поля из объектов внутри 'products'
    order.products.forEach((product) => {
      Object.keys(product).forEach((key) => {
        fields.add(`product_${key}`); // Добавляем префикс, чтобы избежать конфликтов имен
      });
    });
  });   

  

  return Array.from(fields);
}

// Функция для создания Excel файла
export async function createStyledExcel(orders) {
  let workbook;
  if (fs.existsSync(filePath)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
  } else {
    workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Orders');
  }

  const worksheet = workbook.getWorksheet('Orders') || workbook.addWorksheet('Orders');

  // Получаем все уникальные поля
  const fields = getAllFields(orders);

  // Если файл новый, создаем заголовки
  if (worksheet.rowCount === 0) {
    const headerRow = worksheet.addRow(fields);

    // Стили для заголовков
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
      cell.alignment = { horizontal: 'center' };
    });
  }

  // Заполняем таблицу данными
  orders.forEach((order) => {
    const startRow = worksheet.rowCount + 1;

    order.products.forEach((product, index) => {
      const rowData = fields.map((field) => {
        if (field.startsWith('product_')) {
          // Обрабатываем поля из 'products'
          const productField = field.replace('product_', '');
          return product[productField];
        } else {
          // Обрабатываем поля из корневого уровня
          return index === 0 ? order[field] : null; // Только первая строка для корневых полей
        }
      });

      worksheet.addRow(rowData);
    });

    // Объединяем ячейки для корневых полей
    if (order.products.length > 1) {
      fields.forEach((field, colIndex) => {
        if (!field.startsWith('product_')) {
          const colLetter = String.fromCharCode(65 + colIndex); // A, B, C, ...
          worksheet.mergeCells(`${colLetter}${startRow}:${colLetter}${worksheet.rowCount}`);
          worksheet.getCell(`${colLetter}${startRow}`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          };
        }
      });
    }
  });

  // Устанавливаем границы и автоширину колонок
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString().length : 10;
      if (cellValue > maxLength) {
        maxLength = cellValue;
      }
    });
    column.width = maxLength + 2;
  });

  // Сохраняем файл
  await workbook.xlsx.writeFile(filePath);
  console.log('Новые заказы добавлены в orders.xlsx!');
}

// Пример данных
const orders = [
    {
        "_id": {
          "$oid": "679d59753ff08a9b9d22502f"
        },
        "orderNumbers": {
          "orderId": 19312,
          "orderNum": 764516709
        },
        "orderDate": "30.01.25 21:54 UTC+5",
        "totalAmount": "5 400.00 руб.",
        "amoutWithCoupon": "5 170.00 руб.",
        "products": [
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          },
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          },
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          },
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          },
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          },
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          },
        ],
        "coupon": {
          "discountPercent": "10%",
          "code": "Curlegina"
        }
      },
      {
        "_id": {
          "$oid": "679d59753ff08a9b9d22502f"
        },
        "orderNumbers": {
          "orderId": 19312,
          "orderNum": 764516709
        },
        "orderDate": "30.01.25 21:54 UTC+5",
        "totalAmount": "5 400.00 руб.",
        "amoutWithCoupon": "5 170.00 руб.",
        "products": [
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          }
        ],
        "coupon": {
          "discountPercent": "10%",
          "code": "Curlegina"
        }
      },
      {
        "_id": {
          "$oid": "679d59753ff08a9b9d22502f"
        },
        "orderNumbers": {
          "orderId": 19312,
          "orderNum": 764516709
        },
        "orderDate": "30.01.25 21:54 UTC+5",
        "totalAmount": "5 400.00 руб.",
        "amoutWithCoupon": "5 170.00 руб.",
        "products": [
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          }
        ],
        "coupon": {
          "discountPercent": "10%",
          "code": "Curlegina"
        }
      },
      {
        "_id": {
          "$oid": "679d59753ff08a9b9d22502f"
        },
        "orderNumbers": {
          "orderId": 19312,
          "orderNum": 764516709
        },
        "orderDate": "30.01.25 21:54 UTC+5",
        "totalAmount": "5 400.00 руб.",
        "amoutWithCoupon": "5 170.00 руб.",
        "products": [
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          }
        ],
        "coupon": {
          "discountPercent": "10%",
          "code": "Curlegina"
        }
      },
      {
        "_id": {
          "$oid": "679d59753ff08a9b9d22502f"
        },
        "orderNumbers": {
          "orderId": 19312,
          "orderNum": 764516709
        },
        "orderDate": "30.01.25 21:54 UTC+5",
        "totalAmount": "5 400.00 руб.",
        "amoutWithCoupon": "5 170.00 руб.",
        "products": [
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          }
        ],
        "coupon": {
          "discountPercent": "10%",
          "code": "Curlegina"
        }
      },
      {
        "_id": {
          "$oid": "679d59753ff08a9b9d22502f"
        },
        "orderNumbers": {
          "orderId": 19312,
          "orderNum": 764516709
        },
        "orderDate": "30.01.25 21:54 UTC+5",
        "totalAmount": "5 400.00 руб.",
        "amoutWithCoupon": "5 170.00 руб.",
        "products": [
          {
            "quantity": 1,
            "name": "Фоликан AL/PG Сыворотка-активатор двойного действия."
          }
        ],
        "coupon": {
          "discountPercent": "10%",
          "code": "Curlegina"
        }
      }
];


/*
{
    _id: { $oid: '679d59753ff08a9b9d22502f' },
    orderNumbers: { orderId: 19312, orderNum: 764516709 },
    orderDate: '30.01.25 21:54 UTC+5',
    totalAmount: '5 400.00 руб.',
    amoutWithCoupon: '5 170.00 руб.',
    products: [
      { quantity: 1, name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.' },
    ],
    coupon: {
      discountPercent: '10%',
      code: 'Curlegina',
    },
  },
*/
// Создаем Excel файл
createStyledExcel(orders).catch(console.error);