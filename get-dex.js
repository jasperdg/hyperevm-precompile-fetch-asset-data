import dotenv from 'dotenv';
dotenv.config();

export default async function getDexIndex(name) {
  const response = await fetch(process.env.HYPERLIQUID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'perpDexs' })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const results = await response.json();
  const index = results.findIndex(dex => dex?.name === name);

  if (index === -1) {
    throw new Error(`Dex "${name}" not found`);
  }

  console.log(`Found ${name} at index: ${index}`);
  return index;
}
