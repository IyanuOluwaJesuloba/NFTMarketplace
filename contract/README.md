# NFT Marketplace Smart Contracts

NFT Marketplace with RedStone Oracle price feeds deployed on Lisk Sepolia. Features listing, buying, selling NFTs with real-time USD price conversion.

## Features

- ✅ **ERC721 NFT Contract** - Mint custom NFTs with metadata URIs
- ✅ **Marketplace Contract** - List, buy, and cancel NFT listings
- ✅ **RedStone Oracle Integration** - Real-time ETH/USD price conversion
- ✅ **Platform Fees** - Configurable marketplace fees (default 2.5%)
- ✅ **Real-time Pricing** - View NFT prices in both ETH and USD
- ✅ **Price Freshness Checks** - Ensures price data is not stale

## Smart Contracts

### NFT.sol
ERC721 token contract for minting marketplace NFTs.

### NFTMarketplace.sol
Main marketplace contract with RedStone oracle-powered pricing.

**Key Functions:**
- `listNFT(address nftContract, uint256 tokenId, uint256 priceInWei)` - List an NFT for sale
- `buyNFT(uint256 listingId)` - Purchase a listed NFT
- `cancelListing(uint256 listingId)` - Cancel your listing
- `getListing(uint256 listingId)` - Get listing details with USD price
- `getUSDPrice(uint256 weiAmount)` - Convert Wei to USD
- `getLatestPrice()` - Get current ETH/USD price from RedStone
- `updateMaxPriceAge(uint256 newMaxAge)` - Set price staleness threshold

## Setup

### Install Dependencies

```shell
forge install
```

### Configure Environment

1. Copy `.env.example` to `.env`
2. Add your private key and RPC URL:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### Build Contracts

```shell
forge build
```

### Run Tests

```shell
forge test
forge test -vvv  # Verbose output
```

## Deployment

### Option 1: Deploy with Mock Oracle (Recommended for Testing)

Deploy with a mock RedStone oracle for local testing and development:

```shell
forge script script/DeployWithMockOracle.s.sol:DeployWithMockOracleScript \
  --rpc-url lisk-sepolia \
  --broadcast \
  --verify
```

This deploys a `MockRedStoneOracle` with ETH price set to $2000.

### Option 2: Deploy with Real RedStone Oracle (Production)

Set the `REDSTONE_ORACLE_ADDRESS` in your `.env` file to the RedStone oracle address for Lisk Sepolia:

```shell
# Get RedStone oracle address from https://docs.redstone.finance
echo 'REDSTONE_ORACLE_ADDRESS=0x...' >> .env

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url lisk-sepolia \
  --broadcast \
  --verify
```

### Lisk Sepolia Network Details

- **Chain ID**: 4202
- **RPC URL**: https://rpc.sepolia-api.lisk.com
- **Block Explorer**: https://sepolia-blockscout.lisk.com
- **Faucet**: Get test ETH from Lisk Sepolia faucet

## RedStone Oracle

### Why RedStone?

✅ **Native Lisk Support** - RedStone has active support for Lisk Sepolia
✅ **Lower Gas Costs** - Optimized for L2 chains
✅ **Fresh Data** - Updates every ~10 seconds
✅ **1000+ Price Feeds** - Extensive asset coverage

### Getting RedStone Oracle Address

1. **For Lisk Sepolia**: Check [RedStone Documentation](https://docs.redstone.finance)
2. **For Testing**: Use the mock oracle (already included)
3. **Community Support**: Join [RedStone Discord](https://discord.gg/redstone) for help

### Mock Oracle for Testing

The `MockRedStoneOracle` allows you to:
- Set custom prices for testing
- Update prices dynamically
- Test price staleness logic

```solidity
// Example: Update mock price in tests
mockOracle.setPrice(bytes32("ETH"), 2500_00000000); // $2500
```

## Contract Interactions

### Mint an NFT

```shell
cast send <NFT_CONTRACT_ADDRESS> \
  "mint(string)" "ipfs://your-metadata-uri" \
  --rpc-url lisk-sepolia \
  --private-key $PRIVATE_KEY
```

### Approve Marketplace

```shell
cast send <NFT_CONTRACT_ADDRESS> \
  "approve(address,uint256)" <MARKETPLACE_ADDRESS> <TOKEN_ID> \
  --rpc-url lisk-sepolia \
  --private-key $PRIVATE_KEY
```

### List NFT

```shell
cast send <MARKETPLACE_ADDRESS> \
  "listNFT(address,uint256,uint256)" \
  <NFT_CONTRACT_ADDRESS> <TOKEN_ID> 1000000000000000000 \
  --rpc-url lisk-sepolia \
  --private-key $PRIVATE_KEY
```

### Check USD Price

```shell
cast call <MARKETPLACE_ADDRESS> \
  "getUSDPrice(uint256)" 1000000000000000000 \
  --rpc-url lisk-sepolia
```

## Gas Optimization

Contracts are optimized with 200 runs. Adjust in `foundry.toml` if needed.

## Security

- ✅ ReentrancyGuard on critical functions
- ✅ Ownership controls
- ✅ Input validation
- ⚠️ Always audit before mainnet deployment

## Foundry Documentation

- [Forge Documentation](https://book.getfoundry.sh/)
- [Cast Documentation](https://book.getfoundry.sh/cast/)
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)

## License

MIT
