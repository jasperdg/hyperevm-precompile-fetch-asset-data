/**
 * Encoding utilities for HIP-3 asset indices
 */

export const toAssetIndex = (dexIndex, universeIndex) => dexIndex * 10000 + universeIndex;

export const encodeAssetIndex = (index) => {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32BE(index, 28);
  return '0x' + bytes.toString('hex');
};
