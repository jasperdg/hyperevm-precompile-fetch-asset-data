/**
 * Hyperliquid API client
 */

async function apiCall(endpoint, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

export async function getDexIndex(endpoint, dexName) {
  const dexes = await apiCall(endpoint, { type: 'perpDexs' });
  const index = dexes.findIndex(dex => dex?.name === dexName);

  if (index === -1) {
    throw new Error(`Dex "${dexName}" not found`);
  }

  return index;
}

export async function getUniverseIndex(endpoint, dexName, assetName) {
  const data = await apiCall(endpoint, { type: 'metaAndAssetCtxs', dex: dexName });
  const universe = data[0].universe;
  const index = universe.findIndex(asset => asset?.name === assetName);

  if (index === -1) {
    throw new Error(`Asset "${assetName}" not found in dex "${dexName}"`);
  }

  return index;
}
