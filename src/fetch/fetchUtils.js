import axios from 'axios';



export const fetchData = async (url) => {
    let dataResponse = '';
    try {
      const { data } = await axios.get(url, {
        headers: {
          Cookie: 'mcsid=1jEbjbY8slE0_rtYPMnUhRlFvaemtwcIQP80mrRl',
        },
      });
      dataResponse = data;
    } catch (error) {
      console.error(error);
    }
    return dataResponse;
};
  


  