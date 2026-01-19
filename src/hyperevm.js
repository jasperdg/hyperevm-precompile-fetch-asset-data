/**
 * HyperEVM RPC client for precompile queries
 */

import { encodeAssetIndex } from './encoding.js';

export const PRECOMPILES = {
  oracle: '0x0000000000000000000000000000000000000807',
  markpx: '0x0000000000000000000000000000000000000806'
};

async function rpcCall(endpoint, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`);
  }

  return result.result;
}

export function buildRpcRequest(assetIndex, type, block) {
  return {
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      { to: PRECOMPILES[type], input: encodeAssetIndex(assetIndex) },
      block
    ]
  };
}

export async function queryPrice(endpoint, assetIndex, type, block) {
  const rpcBody = buildRpcRequest(assetIndex, type, block);
  const pxHex = await rpcCall(endpoint, rpcBody);
  const pxDecimal = BigInt(pxHex).toString();

  return { assetIndex, pxHex, pxDecimal, type, block };
}
