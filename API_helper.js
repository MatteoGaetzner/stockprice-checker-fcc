const fetch = require('node-fetch')

module.exports = {
  make_API_call: async (url) => {
    const baseUrl = 'https://cloud.iexapis.com/stable/tops?token=' + process.env.TOKEN + '&symbols='
    const response = await fetch(baseUrl + url);
    const data = await response.json();
    return data;
  }
}
