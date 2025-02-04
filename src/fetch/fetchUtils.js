import axios from 'axios';
import 'dotenv/config';

export const fetchData = async (url) => {
  let dataResponse = '';
  try {
    const { data } = await axios.get(url, {
      headers: {
        Cookie: `mcsid=${process.env.MCSID}`,
      },
    });
    dataResponse = data;
  } catch (error) {
    console.error(error);
  }
  return dataResponse;
};
