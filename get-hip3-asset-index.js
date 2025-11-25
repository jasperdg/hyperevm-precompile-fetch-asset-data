import dotenv from 'dotenv';
import getDexIndex from './get-dex.js';
import getUniverseAssetIndex from './get-universe-index.js';

dotenv.config();

const RPC_ENDPOINT = `https://hyperliquid-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

async function getAssetIndex(dexName, assetName) {
    const dexIndex = await getDexIndex(dexName);
    console.log(`Dex index for ${dexName}: ${dexIndex}`);

    const universeIndex = await getUniverseAssetIndex(dexName, assetName);
    console.log(`Universe index for ${assetName}: ${universeIndex}`);

    const assetIndex = toAssetIndex(dexIndex, universeIndex);
    console.log(`Asset index for ${dexName}:${assetName} is ${assetIndex}`);

    return assetIndex;
}

function toAssetIndex(dexIndex, universeIndex) {
  return dexIndex * 10000 + universeIndex;
}

/**
 * Encodes asset index as 32-byte big-endian hex string
 * Equivalent to Rust: bytes[28..].copy_from_slice(&index.to_be_bytes())
 */
function encodeAssetIndex(index) {
    // Create 32-byte buffer filled with zeros
    const bytes = Buffer.alloc(32);
    
    // Convert index to 4-byte big-endian and place at bytes[28..32]
    // This puts the u32 value in the last 4 bytes
    bytes.writeUInt32BE(index, 28);
    
    // Return as hex string with 0x prefix
    return '0x' + bytes.toString('hex');
}

/**
 * Creates RPC body for eth_call to System Oracle precompile
 */
function getRpcBody(assetIndex) {
    return {    
        id: 1,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
            {
                to: "0x0000000000000000000000000000000000000807",
                input: encodeAssetIndex(assetIndex)
            },
            "latest"
        ]
    };
}

/**
 * Queries the System Oracle precompile for oracle price
 */
async function getOraclePx(assetIndex) {
    try {
        const rpcBody = getRpcBody(assetIndex);
        
        console.log('\n=== Querying System Oracle Precompile ===');
        console.log(`Asset Index: ${assetIndex}`);
        console.log(`Encoded Data: ${rpcBody.params[0].input}`);
        console.log(`RPC Endpoint: ${RPC_ENDPOINT}\n`);
        console.log("body: ", JSON.stringify(rpcBody));
        const response = await fetch(RPC_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rpcBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(`RPC error: ${result.error.message}`);
        }
                
        // The result should be a hex string representing the oracle price
        const oraclePxHex = result.result;
        
        // Convert from hex to decimal
        const oraclePxBigInt = BigInt(oraclePxHex);
        
        console.log(`\nOracle Price (hex): ${oraclePxHex}`);
        console.log(`Oracle Price (decimal): ${oraclePxBigInt.toString()}`);
        
        return {
            assetIndex,
            oraclePxHex,
            oraclePxDecimal: oraclePxBigInt.toString(),
        };
        
    } catch (error) {
        console.error('Error querying oracle:', error.message);
        throw error;
    }
}

// Main execution
(async () => {
    try {
        if (process.argv.length < 4) {
            console.error('Usage: node get-oraclePx-precompile.js <dexName> <assetName>');
            process.exit(1);
        }
        const assetIndex = await getAssetIndex(process.argv[2], process.argv[3]);
        const oracleData = await getOraclePx(1040000);
        console.log("assetIndex: ", assetIndex);
        
        console.log('\n=== Final Result ===');
        console.log("oracleData: ", oracleData);
    } catch (error) {
        console.error('Failed:', error.message);
        process.exit(1);
    }
})();