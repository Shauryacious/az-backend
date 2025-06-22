const axios = require("axios");

async function checkSeller(sellerName) {
  try {
    const response = await axios.get(
      `http://localhost:8000/seller/${sellerName}`
    );
    console.log(`API response for seller ${sellerName}:`, response.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

checkSeller("Sony");
