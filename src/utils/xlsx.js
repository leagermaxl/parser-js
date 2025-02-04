import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = 'orders.xlsx';

export async function createStyledExcel(orders) {
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
    const headerRow = worksheet.addRow([
      'Order ID',
      'Order Number',
      'Order Date',
      'Total Amount',
      'Amount With Coupon',
      'Product Name',
      'Quantity',
    ]);

    // Стили для заголовков
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Белый текст
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } }; // Синий фон
      cell.alignment = { horizontal: 'center' };
    });
  }

  let rowIndex = worksheet.rowCount + 1; // Начинаем с первой свободной строки

  orders.forEach((order) => {
    const startRow = rowIndex;
    order.products.forEach((product, index) => {
      worksheet.addRow([
        index === 0 ? order.orderId : null,
        index === 0 ? order.orderNum : null,
        index === 0 ? order.orderDate : null,
        index === 0 ? order.totalAmount : null,
        index === 0 ? order.amountWithCoupon : null,
        product.name,
        product.quantity,
      ]);
      rowIndex++;
    });

    // Объединяем ячейки для заказной информации
    // if (order.products.length > 1) {
    ['A', 'B', 'C', 'D', 'E'].forEach((col) => {
      worksheet.mergeCells(`${col}${startRow}:${col}${rowIndex - 1}`);
      worksheet.getCell(`${col}${startRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    });
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
  });

  // Сохранение файла
  await workbook.xlsx.writeFile(filePath);
  console.log('Новые заказы добавлены в orders.xlsx!');
}
