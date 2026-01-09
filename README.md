# HIP-3 Asset Index & Oracle Price Query

Query HyperEVM System Oracle prices for HIP-3 perpetual assets.

## Quick Start

```bash
# Install dependencies
npm install

# Run the script
node get-hip3-asset-index.js <dexName> <assetName>

# Example
node get-hip3-asset-index.js xyz xyz:NVDA
```

## Environment Variables

Create a `.env` file with:

```bash
ALCHEMY_API_KEY=your_alchemy_api_key
HYPERLIQUID_ENDPOINT=https://api.hyperliquid-testnet.xyz/info
```

| Variable | Description |
|----------|-------------|
| `ALCHEMY_API_KEY` | Alchemy API key for HyperEVM RPC access |
| `HYPERLIQUID_ENDPOINT` | Hyperliquid API endpoint (testnet or mainnet) |

## Project Structure

```
├── get-hip3-asset-index.js   # Main script - calculates asset index & queries oracle
├── get-dex.js                # Helper - finds dex index by name
├── get-universe-index.js     # Helper - finds universe index by asset name
├── package.json
└── README.md
```

## How It Works

### 1. Asset Index Calculation

```
assetIndex = dexIndex × 10000 + universeIndex
```

**Example: str:GOLD**
- dexIndex: `104` (str dex)
- universeIndex: `0` (first asset)
- assetIndex: `104 × 10000 + 0 = 1040000`

### 2. Encoding

The asset index is encoded as a 32-byte big-endian hex value:

```
0x00000000000000000000000000000000000000000000000000000000000fde80
                                                              └─ 1040000
```

### 3. Oracle Query

Sends an `eth_call` to the System Oracle precompile:

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

## Example Output

```bash
$ node get-hip3-asset-index.js str str:GOLD

Found str at index: 104
Dex index for str: 104
Found str:GOLD at index: 0
Universe index for str:GOLD: 0
Asset index: 1040000

=== Querying System Oracle Precompile ===
Asset Index: 1040000
Encoded Data: 0x00000000000000000000000000000000000000000000000000000000000fde80
RPC Endpoint: https://hyperliquid-testnet.g.alchemy.com/v2/****
Request Body: {"id":1,"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0000000000000000000000000000000000000807","input":"0x00000000000000000000000000000000000000000000000000000000000fde80"},"latest"]}
Oracle Price (hex): 0x000000000000000000000000000000000000000000000000000000000006d364
Oracle Price (decimal): 447332

=== Final Result ===
{
  assetIndex: 1040000,
  oraclePxHex: '0x000000000000000000000000000000000000000000000000000000000006d364',
  oraclePxDecimal: '447332'
}
```

## Troubleshooting

### PrecompileError

If you receive `EVM error: PrecompileError`, the asset may not be registered in the System Oracle yet.

**Solutions:**
1. Verify the dex and asset names are correct
2. Try a different asset that's known to be registered
3. Query the dex's oracle updater contract directly

### API Errors

If the Hyperliquid API returns errors:
- Check your `HYPERLIQUID_ENDPOINT` is correct
- For mainnet: `https://api.hyperliquid.xyz/info`
- For testnet: `https://api.hyperliquid-testnet.xyz/info`

## Resources

- [Hyperliquid Docs](https://hyperliquid.gitbook.io/)
- [HyperEVM Oracle Contracts](https://github.com/hyperlendx/hyperevm-oracle)
- [Alchemy](https://www.alchemy.com/) - Get an API key for HyperEVM RPC
