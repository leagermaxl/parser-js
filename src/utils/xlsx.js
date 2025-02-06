import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// async function createFolder() {
const date = new Date();
const folderName = `${String(date.getDate()).padStart(2, '0')}-${String(
  date.getMonth() + 1,
).padStart(2, '0')}-${date.getFullYear()}`;

const folderPath = path.join(process.cwd(), folderName);

// }

// const filePath = folderPath + 'orders.xlsx';

export async function createStyledExcel(couponCode, orders) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`📁 Папка создана: ${folderPath}`);
  } else {
    console.log(`⚠ Папка уже существует: ${folderPath}`);
  }

  const filePath = folderPath + `\\${couponCode}.xlsx`;
  let workbook;
  // Если файл существует, загружаем его
  if (fs.existsSync(filePath)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
  } else {
    // Если файла нет, создаём новый
    workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Orders');
  }

  const worksheet = workbook.getWorksheet('Orders') || workbook.addWorksheet('Orders');

  // Если файл новый, создаём заголовки
  if (worksheet.rowCount === 0) {
    let headerRow;
    if (couponCode === 'face10') {
      headerRow = worksheet.addRow([
        '№',
        '№ заказа',
        'Дата',
        'Сумма заказа',
        'Сумма выплаты 15%',
        'Статус',
        'Наименование',
        'Количество',
        'Сумма',
      ]);
    } else {
      headerRow = worksheet.addRow([
        '№',
        '№ заказа',
        'Сумма заказа',
        'Сумма выплаты 15%',
        'Статус',
        'Сумма',
      ]);
    }

    // Стили для заголовков
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Белый текст
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } }; // Синий фон
      cell.alignment = { horizontal: 'center' };
    });
  }

  // // Если файл новый, создаём заголовки
  // if (worksheet.rowCount === 0) {
  //   const headerRow = worksheet.addRow([
  //     'Order ID',
  //     'Order Number',
  //     'Order Date',
  //     'Total Amount',
  //     'Amount With Coupon',
  //     'Product Name',
  //     'Quantity',
  //   ]);

  //   // Стили для заголовков
  //   headerRow.eachCell((cell) => {
  //     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Белый текст
  //     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } }; // Синий фон
  //     cell.alignment = { horizontal: 'center' };
  //   });
  // }

  let rowIndex = worksheet.rowCount + 1; // Начинаем с первой свободной строки

  orders.some((order, ind) => {
    const startRow = rowIndex;
    if (couponCode === 'face10') {
      order.products.forEach((product, index) => {
        worksheet.addRow([
          index === 0 ? ind : null,
          index === 0 ? order.orderId : null,
          index === 0 ? order.orderDate : null,
          index === 0 ? order.amountWithCoupon : null,
          index === 0 ? order.amountPayment : null,
          index === 0 ? order.orderStatus.text : null,
          product.name,
          product.quantity,
          ind === 0 ? orders['amountEntire'] : null,
        ]);
        rowIndex++;
      });
      // Объединяем ячейки для заказной информации
      ['A', 'B', 'C', 'D', 'E', 'F', 'I'].forEach((col) => {
        worksheet.mergeCells(`${col}${startRow}:${col}${rowIndex - 1}`);
        worksheet.getCell(`${col}${startRow}`).alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
      });
    } else {
      worksheet.addRow([
        ind,
        order.orderId,
        order.amountWithCoupon,
        order.amountPayment,
        order.orderStatus.text,
        ind === 0 ? orders['amountEntire'] : null,
      ]);
      rowIndex++;
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col) => {
        worksheet.getCell(`${col}${startRow}`).alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
      });
    }

    // }

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
    if (ind >= orders.length - 2) return true;
  });

  // Сохранение файла
  await workbook.xlsx.writeFile(filePath);
  console.log(`Новые заказы добавлены в ${filePath}!`);
}
