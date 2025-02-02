import axios from 'axios';
import { getAccessToken } from './sdek_token.js';

async function getAllOrders(accessToken, page = 0, size = 100) {
  try {
    const response = await axios.get('https://api.cdek.ru/v2/orders', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      params: {
        page: page, // Номер страницы (начинается с 0)
        size: size, // Количество заказов на странице
      },
    });

    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка заказов:', error.response ? error.response.data : error.message);
    throw error;
  }
}




// Пример использования
(async () => {
  try {
    const accessToken = await getAccessToken();
    const orders = await getAllOrders(accessToken, 0, 10); // Получаем первую страницу с 10 заказами
    console.log('Список заказов:', orders);
  } catch (error) {
    console.error('Ошибка:', error);
  }
})();