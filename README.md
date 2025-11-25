# Hyperliquid API Scripts

Collection of scripts to interact with Hyperliquid's API and HyperEVM System Oracle.

## Scripts

### 1. get-dex.js
Helper module that queries the Hyperliquid API to find a dex by name and returns its index.

**Usage (as module):**
```javascript
import getDexIndex from './get-dex.js';
const dexIndex = await getDexIndex('str'); // Returns 104
```

### 2. get-universe-index.js
Helper module that queries the Hyperliquid API to find an asset within a dex and returns its universe index.

**Usage (as module):**
```javascript
import getUniverseAssetIndex from './get-universe-index.js';
const universeIndex = await getUniverseAssetIndex('str', 'str:GOLD'); // Returns 0
```

### 3. get-hip3-asset-index.js
Main script that calculates the asset index and queries the HyperEVM System Oracle precompile for oracle prices.

**Usage:**
```bash
node get-hip3-asset-index.js <dexName> <assetName>
```

**Example:**
```bash
node get-hip3-asset-index.js str str:GOLD
```

**What it does:**
1. Queries Hyperliquid API to get the dex index for the specified dex name
2. Queries Hyperliquid API to get the universe index for the specified asset within that dex
3. Calculates the asset index using: `assetIndex = dexIndex * 10000 + universeIndex`
4. Encodes the asset index as a 32-byte big-endian hex string
5. Calls the System Oracle precompile at `0x0000000000000000000000000000000000000807`
6. Returns the oracle price data

## How Asset Index Calculation Works

The asset index combines the dex index and universe index:

```
assetIndex = dexIndex * 10000 + universeIndex
```

**Example: str:GOLD**
- dexIndex: 104 (str dex)
- universeIndex: 0 (first asset in str dex)
- assetIndex: 104 * 10000 + 0 = 1040000

## HyperEVM System Oracle Precompile

The System Oracle precompile is located at:
```
0x0000000000000000000000000000000000000807
```

### Encoding

The asset index is encoded as a 32-byte big-endian value:
- First 28 bytes: zeros (padding)
- Last 4 bytes: asset index in big-endian format

**Example for asset index 1040000 (0xFDE80):**
```
0x00000000000000000000000000000000000000000000000000000000000fde80
                                                              └─ 0xFDE80 = 1040000
```

### RPC Call Format

```json
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000807",
      "input": "0x00000000000000000000000000000000000000000000000000000000000fde80"
    },
    "latest"
  ],
  "id": 1
}
```

### Response Format

The precompile returns a hex-encoded value representing the oracle price.

## Known Limitations

### PrecompileError on Testnet/Mainnet

Currently, many assets return a `PrecompileError` when queried. This indicates:

1. **Asset Not Registered**: The asset hasn't been registered in the System Oracle yet
2. **No Oracle Updates**: The oracle hasn't received price updates for this asset
3. **Testnet Limitation**: The testnet System Oracle may not be fully populated

**Workaround:** For custom perp dexes, you may need to query the dex's oracle updater contract directly or use the Hyperliquid API instead.

## Setup

1. **Install dependencies:**
```bash
npm install
```

The script requires:
- `dotenv` - for environment variable management
- `ethers` (optional) - only needed if using ABI decoding features

2. **Create a `.env` file:**
```bash
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

Get an Alchemy API key from: https://www.alchemy.com/

## Example Output

```bash
$ node get-hip3-asset-index.js str str:GOLD

Found "str" at index: 104
Dex index for str: 104
Found str:GOLD at index: 0
Universe index for str:GOLD: 0
Asset index for str:str:GOLD is 1040000

=== Querying System Oracle Precompile ===
Asset Index: 1040000
Encoded Data: 0x00000000000000000000000000000000000000000000000000000000000fde80
RPC Endpoint: https://hyperliquid-testnet.g.alchemy.com/v2/...

Oracle Price (hex): 0x...
Oracle Price (decimal): ...

=== Final Result ===
{
  "assetIndex": 1040000,
  "oraclePxHex": "0x...",
  "oraclePxDecimal": "..."
}
```

## Troubleshooting

### PrecompileError

If you receive `EVM error: PrecompileError`:

1. **Check if the asset exists**: Verify the dex and asset names are correct
2. **Try a different asset**: Not all assets may be registered in the System Oracle
3. **Use mainnet instead of testnet**: Some assets may only be available on mainnet
4. **Alternative approach**: Query the oracle updater contract directly

For str dex, the oracle updater is at: `0xae8f7cbfae2061834f4bd716ed44f7654c6b2795`

### Invalid API Response

If the Hyperliquid API returns errors:
- Check your internet connection
- Verify you're using the correct API endpoint
- Try the mainnet API: `https://api.hyperliquid.xyz/info`

## Resources

- **Hyperliquid Testnet API**: https://api.hyperliquid-testnet.xyz/info
- **Hyperliquid Mainnet API**: https://api.hyperliquid.xyz/info
- **HyperEVM Testnet RPC**: Via Alchemy
- **HyperEVM Mainnet RPC**: https://rpc.hyperliquid.xyz/evm
- **HyperEVM Oracle Contracts**: https://github.com/hyperlendx/hyperevm-oracle
- **Hyperliquid Docs**: https://hyperliquid.gitbook.io/
