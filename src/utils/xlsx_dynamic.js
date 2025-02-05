import ExcelJS from 'exceljs';
import fs from 'fs';

// Функция для получения всех уникальных полей из заказов
function getAllFields(orders) {
  const fields = new Set();
  orders.forEach((order) => {
    Object.keys(order).forEach((key) => {
      if (key !== 'products') {
        if (order[key] && typeof order[key] === 'object' && !Array.isArray(order[key])) {
          if (order[key] instanceof Date) {
            // Если это объект Date, добавляем его как обычное поле
            fields.add(key);
          } else {
            // Иначе добавляем вложенные поля
            Object.keys(order[key]).forEach((subKey) => {
              fields.add(`${key}.${subKey}`);
            });
          }
        } else {
          fields.add(key);
        }
      }
    });

    order.products.forEach((product) => {
      if (product.quantity !== undefined) fields.add('product.quantity');
      if (product.name !== undefined) fields.add('product.name');
    });
  });
  return Array.from(fields);
}

// Функция для форматирования даты
function formatDate(date) {
  if (!(date instanceof Date)) return date; // Если это не дата, возвращаем как есть
  return date.toLocaleDateString('ru-RU'); // Форматируем дату в формате DD.MM.YYYY
}

// Функция для форматирования денежной суммы
function formatCurrency(value) {
  if (typeof value === 'string') {
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, '')); // Убираем пробелы и символы валюты
    return isNaN(numericValue) ? value : numericValue;
  }
  return value;
}

// Функция для безопасного получения значения по вложенному пути
function getFieldValue(obj, field) {
  return field.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : null;
  }, obj);
}

// Функция для создания Excel файла
export async function createStyledExcel(orders, filePath) {
  let workbook;
  if (fs.existsSync(filePath)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
  } else {
    workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Orders');
  }

  const worksheet = workbook.getWorksheet('Orders') || workbook.addWorksheet('Orders');

  // Получаем все уникальные поля (без поля products)
  const fields = getAllFields(orders);

  // Если файл новый, создаём заголовки
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
    // Для каждого продукта создаём отдельную строку
    order.products.forEach((product, index) => {
      const rowData = fields.map((field) => {
        // Если поле относится к продукту
        if (field.startsWith('product.')) {
          // Например, field = "product.quantity" или "product.name"
          const productField = field.split('.')[1]; // получаем 'quantity' или 'name'
          return product[productField];
        } else {
          // Для корневых полей запишем данные только в первую строку заказа
          const value = index === 0 ? getFieldValue(order, field) : null;
          // Форматируем дату, если это объект Date
          if (field === 'totalAmount' || field === 'amountWithCoupon') {
            return formatCurrency(value); // Форматируем денежное значение
          }
          return value instanceof Date ? formatDate(value) : value;
        }
      });

      const row = worksheet.addRow(rowData);

      // Применяем выравнивание по центру для всех ячеек, кроме product.name
      row.eachCell((cell, colNumber) => {
        const field = fields[colNumber - 1];
        if (field !== 'product.name') {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Если это денежный столбец, применяем форматирование
        if (field === 'totalAmount' || field === 'amountWithCoupon') {
          cell.numFmt = '"₽" #,##0.00'; // Формат денежного поля с рублями
        }
      });
    });

    // Если в заказе несколько продуктов, объединяем ячейки для корневых данных
    if (order.products.length > 1) {
      fields.forEach((field, colIndex) => {
        if (!field.startsWith('product.')) {
          // Определяем букву столбца
          const colLetter = worksheet.getColumn(colIndex + 1).letter;
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
  console.log(`Новые заказы добавлены в ${filePath}`);
}
