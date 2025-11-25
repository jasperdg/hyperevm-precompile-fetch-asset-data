import dotenv from 'dotenv';
dotenv.config();

export default async function getUniverseAssetIndex(dexName, assetName) {
    try {
      const response = await fetch(process.env.HYPERLIQUID_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "metaAndAssetCtxs",
            dex: dexName
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const results = await response.json();
      const universe = results[0].universe;
  
      // Loop through the array to find the result with name "str"
      for (let i = 0; i < universe.length; i++) {
        if (universe[i] && universe[i].name === assetName) {
          console.log(`Found ${assetName} at index: ${i}`);
          return i;
        }
      }
  
      console.log(`Result with name ${assetName} not found`);
      return -1;
  
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  }
  