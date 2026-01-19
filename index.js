#!/usr/bin/env node

import dotenv from 'dotenv';
import { toAssetIndex } from './src/encoding.js';
import { getDexIndex, getUniverseIndex } from './src/hyperliquid.js';
import { PRECOMPILES, buildRpcRequest, queryPrice } from './src/hyperevm.js';

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const config = {
  hyperliquid: process.env.HYPERLIQUID_ENDPOINT,
  hyperevm: `https://hyperliquid-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
};

const TYPE_NAMES = { oracle: 'Oracle', markpx: 'Mark' };

// ============================================================================
// CLI
// ============================================================================

function normalizeBlock(block) {
  if (!block || ['latest', 'pending', 'earliest'].includes(block)) {
    return block || 'latest';
  }
  if (block.startsWith('0x')) {
    return block;
  }
  // Convert decimal string to hex
  return '0x' + BigInt(block).toString(16);
}

function parseArgs() {
  const [, , dexName, assetName, type, rawBlock] = process.argv;

  if (!dexName || !assetName || !type) {
    console.error('Usage: node index.js <dexName> <assetName> <oracle|markpx> [block]');
    process.exit(1);
  }

  if (!PRECOMPILES[type]) {
    console.error(`Invalid type "${type}". Use "oracle" or "markpx".`);
    process.exit(1);
  }

  return { dexName, assetName, type, block: normalizeBlock(rawBlock) };
}

async function main() {
  const { dexName, assetName, type, block } = parseArgs();
  const typeName = TYPE_NAMES[type];

  // Resolve asset index
  const dexIndex = await getDexIndex(config.hyperliquid, dexName);
  console.log(`Dex index for ${dexName}: ${dexIndex}`);

  const universeIndex = await getUniverseIndex(config.hyperliquid, dexName, assetName);
  console.log(`Universe index for ${assetName}: ${universeIndex}`);

  const assetIndex = toAssetIndex(dexIndex, universeIndex);
  console.log(`Asset index: ${assetIndex}`);

  // Query price
  const rpcBody = buildRpcRequest(assetIndex, type, block);

  console.log(`\n=== Querying ${typeName} Precompile ===`);
  console.log(`Precompile: ${PRECOMPILES[type]}`);
  console.log(`Asset Index: ${assetIndex}`);
  console.log(`Block: ${block}`);
  console.log(`Encoded Data: ${rpcBody.params[0].input}`);
  console.log(`Request: ${JSON.stringify(rpcBody)}`);

  const result = await queryPrice(config.hyperevm, assetIndex, type, block);

  console.log(`${typeName} Price (hex): ${result.pxHex}`);
  console.log(`${typeName} Price (decimal): ${result.pxDecimal}`);

  console.log('\n=== Result ===');
  console.log(result);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
