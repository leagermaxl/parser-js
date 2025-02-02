const axios = require('axios');

const client_id = 'ВАШ_CLIENT_ID'; // Замените на ваш Client ID
const client_secret = 'ВАШ_CLIENT_SECRET'; // Замените на ваш Client Secret

async function getAccessToken() {
  const response = await axios.post('https://api.cdek.ru/v2/oauth/token', {
    grant_type: 'client_credentials',
    client_id: client_id,
    client_secret: client_secret,
  });

  return response.data.access_token;
}

// Пример использования
(async () => {
  try {
    const accessToken = await getAccessToken();
    console.log('Токен доступа:', accessToken);
  } catch (error) {
    console.error('Ошибка:', error.response ? error.response.data : error.message);
  }
})();