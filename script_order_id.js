import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

const fetchData = async (url) => {
  let dataResponse = '';
  try {
    const { data } = await axios.get(url, {
      headers: {
        Cookie: 'mcsid=1jEbjbY8slE0_rtYPMnUhRlFvaemtwcIQP80mrRl',
      },
    });
    dataResponse = data;
    console.log(dataResponse);
  } catch (error) {
    console.error(error);
  }
  return dataResponse;
};

const processFetchDataPages = async (path, linkMakr) => {
  let html = null;
  if (!linkMakr) html = await fs.readFile(path, 'utf-8');
  else html = await fetchData(path);

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const pages = document.querySelector('.page-nums').textContent.trim().split(/\s+/);
  const orderIdsHTML = document.querySelectorAll('tr.order td.order-number span.objectAction');

  const orderIds = Array.from(orderIdsHTML).map((orderId) => {
    const order = orderId.textContent.replace(/[()]/g, '').split(/\s+/);
    return { orderNumber: order[0], orderId: order[1] };
  });

  return { pages, orderIds };
};

function requestsForOrders(url) {
  let i = 0;
  const { pages, orderIds } = processFetchData(url, true);

  function myCallback() {
    const updatedUrl = url.replace(/(order_id=)\d+/, `$1${arr[i]}`);
    console.log(updatedUrl);
    console.log('[REQUEST TO]:', `${updatedUrl}`);

    // const filePath = './HTML.html';

    if (i === arr.length - 1) return;

    const { max, min } = { max: 5000, min: 500 };
    const randomInterval = Math.floor(Math.random() * (max - min + 1)) + 500;

    setTimeout(myCallback, randomInterval);
    i++;
  }

  myCallback();
}

const url =
  'https://cp21.megagroup.ru/-/cms/v1/shop2/order/?shop_id=4373441&ver_id=1586314&access=u%3B1623555&p=0';

requestsForOrders(url);
