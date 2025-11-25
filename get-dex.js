import dotenv from 'dotenv';
dotenv.config();


export default async function getDexIndex(name) {
  try {
    const response = await fetch(process.env.HYPERLIQUID_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'perpDexs'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();

    // Loop through the array to find the result with name "str"
    for (let i = 0; i < results.length; i++) {
      if (results[i] && results[i].name === name) {
        console.log(`Found ${name} at index: ${i}`);
        return i;
      }
    }

    console.log(`Result with name ${name} not found`);
    return -1;

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
