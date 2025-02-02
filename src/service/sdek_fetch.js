async function getOrderByUuid(accessToken, orderUuid) {
    const response = await axios.get(`https://api.cdek.ru/v2/orders/${orderUuid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  
    return response.data;
  }
  
  // Пример использования
  (async () => {
    try {
      const accessToken = await getAccessToken();
      const orderUuid = 'UUID_ВАШЕГО_ЗАКАЗА'; // UUID заказа
      const order = await getOrderByUuid(accessToken, orderUuid);
      console.log('Информация о заказе:', order);
    } catch (error) {
      console.error('Ошибка:', error.response ? error.response.data : error.message);
    }
  })();