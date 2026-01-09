import dotenv from 'dotenv';
dotenv.config();

export default async function getUniverseAssetIndex(dexName, assetName) {
  const response = await fetch(process.env.HYPERLIQUID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs', dex: dexName })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const results = await response.json();
  const universe = results[0].universe;
  const index = universe.findIndex(asset => asset?.name === assetName);

  if (index === -1) {
    throw new Error(`Asset "${assetName}" not found in dex "${dexName}"`);
  }

  console.log(`Found ${assetName} at index: ${index}`);
  return index;
}
