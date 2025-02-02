import axios from 'axios';
import 'dotenv/config';

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

export async function getAccessToken() {
  try {
    const response = await axios.post(
      'https://api.edu.cdek.ru/v2/oauth/token',
      {
        grant_type: 'client_credentials',
        client_id: client_id,
        client_secret: client_secret,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      'Ошибка при получении токена:',
       error.message,
    );
    throw error;
  }
}

// Пример использования
(async () => {
  try {
    const accessToken = await getAccessToken();
    console.log('Токен доступа:', accessToken);
  } catch (error) {
    console.error('Ошибка:');
  }
})();
