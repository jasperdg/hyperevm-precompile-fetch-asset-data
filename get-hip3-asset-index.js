import dotenv from 'dotenv';
import getDexIndex from './get-dex.js';
import getUniverseAssetIndex from './get-universe-index.js';

dotenv.config();

// Constants
const RPC_ENDPOINT = `https://hyperliquid-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const PRECOMPILES = {
  oracle: '0x0000000000000000000000000000000000000807',
  markpx: '0x0000000000000000000000000000000000000806'
};

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
 * Creates RPC body for eth_call to precompile
 */
function buildRpcRequest(assetIndex, precompileType, block = 'latest') {
  return {
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      { to: PRECOMPILES[precompileType], input: encodeAssetIndex(assetIndex) },
      block
    ]
  };
}

/**
 * Queries a precompile for price data
 */
async function getPx(assetIndex, precompileType, block = 'latest') {
  const rpcBody = buildRpcRequest(assetIndex, precompileType, block);
  const typeName = precompileType === 'oracle' ? 'Oracle' : 'Mark';

  console.log(`\n=== Querying ${typeName} Precompile ===`);
  console.log(`Precompile: ${PRECOMPILES[precompileType]}`);
  console.log(`Asset Index: ${assetIndex}`);
  console.log(`Block: ${block}`);
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

  const pxHex = result.result;
  const pxDecimal = BigInt(pxHex).toString();

  console.log(`${typeName} Price (hex): ${pxHex}`);
  console.log(`${typeName} Price (decimal): ${pxDecimal}`);

  return { assetIndex, pxHex, pxDecimal, type: precompileType, block };
}

// Main execution
(async () => {
  if (process.argv.length < 5) {
    console.error('Usage: node get-hip3-asset-index.js <dexName> <assetName> <oracle|markpx> [block]');
    process.exit(1);
  }

  try {
    const [, , dexName, assetName, precompileType, block = 'latest'] = process.argv;

    if (!PRECOMPILES[precompileType]) {
      console.error('Invalid precompile type. Use "oracle" or "markpx".');
      process.exit(1);
    }

    const assetIndex = await getAssetIndex(dexName, assetName);
    const priceData = await getPx(assetIndex, precompileType, block);

    console.log('\n=== Final Result ===');
    console.log(priceData);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
