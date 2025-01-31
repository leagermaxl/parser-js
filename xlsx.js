import ExcelJS from 'exceljs';

// Пример данных
const orders = [
  {
    orderNumbers: { orderId: 19158, orderNum: 758382709 },
    orderDate: '25.01.25 17:32 UTC+5',
    totalAmount: '14 120.00 руб.',
    amoutWithCoupon: '14 120.00 руб.',
    products: [
      { quantity: 2, name: 'Фоликан AL/PG Сыворотка-активатор двойного действия.' },
      { quantity: 1, name: 'Идерил Гель глубокого очищения' },
      { quantity: 1, name: 'Бальзам для волос с комплексом аминокислот, 200 мл' },
      { quantity: 1, name: 'DS-5 Шампунь-концентрат  восстанавливающий' },
    ],
  },
];

export async function createStyledExcel(orders) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  // Заголовки таблицы
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

  let rowIndex = 2; // Начинаем со 2-й строки, т.к. 1-я — заголовки

  orders.forEach((order) => {
    const startRow = rowIndex;
    order.products.forEach((product, index) => {
      worksheet.addRow([
        index === 0 ? order.orderNumbers.orderId : null, // Order ID только в первой строке
        index === 0 ? order.orderNumbers.orderNum : null, // Order Number только в первой строке
        index === 0 ? order.orderDate : null, // Order Date только в первой строке
        index === 0 ? order.totalAmount : null, // Total Amount только в первой строке
        index === 0 ? order.amoutWithCoupon : null, // Amount With Coupon только в первой строке
        product.name,
        product.quantity,
      ]);
      rowIndex++;
    });

    // Объединяем ячейки для заказной информации (если больше 1 строки)
    if (order.products.length > 1) {
      ['A', 'B', 'C', 'D', 'E'].forEach((col) => {
        worksheet.mergeCells(`${col}${startRow}:${col}${rowIndex - 1}`);
        worksheet.getCell(`${col}${startRow}`).alignment = {
          vertical: 'middle',
          // horizontal: 'center',
        };
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

  // Сохраняем Excel-файл
  await workbook.xlsx.writeFile('orders.xlsx');
  console.log('Файл orders.xlsx с оформлением сохранён!');
}
