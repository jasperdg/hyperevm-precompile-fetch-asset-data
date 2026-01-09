import dotenv from 'dotenv';
import getDexIndex from './get-dex.js';
import getUniverseAssetIndex from './get-universe-index.js';

dotenv.config();

// Constants
const RPC_ENDPOINT = `https://hyperliquid-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const ORACLE_PRECOMPILE = '0x0000000000000000000000000000000000000807';

/**
 * Calculates asset index from dex and universe indices
 */
function toAssetIndex(dexIndex, universeIndex) {
  return dexIndex * 10000 + universeIndex;
}

/**
 * Encodes asset index as 32-byte big-endian hex string
 */
function encodeAssetIndex(index) {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32BE(index, 28);
  return '0x' + bytes.toString('hex');
}

/**
 * Resolves dex name and asset name to an asset index
 */
async function getAssetIndex(dexName, assetName) {
  const dexIndex = await getDexIndex(dexName);
  console.log(`Dex index for ${dexName}: ${dexIndex}`);

  const universeIndex = await getUniverseAssetIndex(dexName, assetName);
  console.log(`Universe index for ${assetName}: ${universeIndex}`);

  const assetIndex = toAssetIndex(dexIndex, universeIndex);
  console.log(`Asset index: ${assetIndex}`);

  return assetIndex;
}

/**
 * Creates RPC body for eth_call to System Oracle precompile
 */
function buildRpcRequest(assetIndex) {
  return {
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      { to: ORACLE_PRECOMPILE, input: encodeAssetIndex(assetIndex) },
      'latest'
    ]
  };
}

/**
 * Queries the System Oracle precompile for oracle price
 */
async function getOraclePx(assetIndex) {
  const rpcBody = buildRpcRequest(assetIndex);

  console.log('\n=== Querying System Oracle Precompile ===');
  console.log(`Asset Index: ${assetIndex}`);
  console.log(`Encoded Data: ${rpcBody.params[0].input}`);
  console.log(`RPC Endpoint: ${RPC_ENDPOINT}`);
  console.log(`Request Body: ${JSON.stringify(rpcBody)}`);

  const response = await fetch(RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rpcBody)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`);
  }

  const oraclePxHex = result.result;
  const oraclePxDecimal = BigInt(oraclePxHex).toString();

  console.log(`Oracle Price (hex): ${oraclePxHex}`);
  console.log(`Oracle Price (decimal): ${oraclePxDecimal}`);

  return { assetIndex, oraclePxHex, oraclePxDecimal };
}

// Main execution
(async () => {
  if (process.argv.length < 4) {
    console.error('Usage: node get-hip3-asset-index.js <dexName> <assetName>');
    process.exit(1);
  }

  try {
    const [, , dexName, assetName] = process.argv;
    const assetIndex = await getAssetIndex(dexName, assetName);
    const oracleData = await getOraclePx(assetIndex);

    console.log('\n=== Final Result ===');
    console.log(oracleData);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
