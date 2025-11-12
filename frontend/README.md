# NFT Marketplace Frontend

Modern, responsive frontend for the NFT Marketplace with real-time oracle price feeds on Lisk Sepolia.

## Features

- ✅ **Wallet Connection** - MetaMask and Web3 wallet support
- ✅ **Mint NFTs** - Create new NFTs with metadata URIs
- ✅ **List NFTs** - List your NFTs for sale with ETH pricing
- ✅ **Buy NFTs** - Purchase listed NFTs directly
- ✅ **Real-time Prices** - View NFT prices in both ETH and USD
- ✅ **Oracle Integration** - Live ETH/USD price feed from Chainlink
- ✅ **Modern UI** - Built with Next.js, TailwindCSS, and TypeScript

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: TailwindCSS
- **Web3**: ethers.js v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Language**: TypeScript

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and update with your contract addresses:

```bash
cp .env.example .env.local
```

Update the following values in `.env.local`:

```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=4202
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia-api.lisk.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketplace.

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

## Usage Guide

### Connect Wallet

1. Click "Connect Wallet" button
2. Approve connection in MetaMask
3. Switch to Lisk Sepolia if prompted

### Mint an NFT

1. Upload your NFT metadata to IPFS (e.g., via Pinata)
2. Copy the IPFS URI (`ipfs://...`)
3. Paste into "Mint New NFT" form
4. Click "Mint NFT" and confirm transaction

### List NFT for Sale

1. Enter your NFT Token ID
2. Set price in ETH
3. Click "List NFT"
4. Approve marketplace (first time only)
5. Confirm listing transaction

### Buy an NFT

1. Browse active listings
2. Click "Buy Now" on desired NFT
3. Confirm transaction with exact payment amount

### Cancel Listing

1. Find your listed NFT (marked with red button)
2. Click "Cancel Listing"
3. Confirm transaction

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx        # Root layout with Web3Provider
│   ├── page.tsx          # Main marketplace page
│   └── globals.css       # Global styles
├── components/
│   ├── Header.tsx        # Header with wallet connection
│   ├── MintNFT.tsx       # NFT minting component
│   ├── ListNFT.tsx       # NFT listing component
│   ├── NFTCard.tsx       # NFT display card
│   └── PriceOracle.tsx   # Live ETH/USD price display
├── context/
│   └── Web3Context.tsx   # Web3 provider and wallet state
├── config/
│   └── contracts.ts      # Contract addresses and ABIs
└── package.json
```

## Key Components

### Web3Context

Manages wallet connection, network switching, and provides Web3 instance to components.

### MintNFT

Allows users to mint new NFTs by providing a metadata URI (typically IPFS).

### ListNFT

Enables NFT owners to list their NFTs for sale with automatic marketplace approval.

### NFTCard

Displays NFT information including:
- Token ID
- Seller address
- Price in ETH
- Real-time USD equivalent
- Buy/Cancel actions

### PriceOracle

Shows live ETH/USD price from Chainlink oracle, updating every 30 seconds.

## Network Configuration

**Lisk Sepolia Testnet**
- **Chain ID**: 4202 (0x106A)
- **RPC URL**: https://rpc.sepolia-api.lisk.com
- **Explorer**: https://sepolia-blockscout.lisk.com
- **Faucet**: Available through Lisk Sepolia faucet

## Troubleshooting

### MetaMask shows wrong network

The app will automatically prompt you to switch to Lisk Sepolia or add the network if needed.

### Transaction fails

- Ensure you have enough Sepolia ETH for gas
- Check that you approved the marketplace contract
- Verify contract addresses in `.env.local`

### Prices not loading

- Check that marketplace contract address is correct
- Ensure RPC URL is accessible
- Verify oracle is deployed and functioning

## Development

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
```

### Adding New Features

1. Create new components in `components/`
2. Update Web3Context if new contract interactions needed
3. Add contract ABIs to `config/contracts.ts`
4. Style with TailwindCSS utility classes

## Security Notes

- Never commit `.env.local` with private keys
- Always verify contract addresses before transactions
- Test thoroughly on testnet before mainnet
- Users should verify NFT ownership before purchase

## License

MIT

## Support

For issues or questions:
- Check contract README for deployment details
- Ensure all environment variables are set correctly
- Verify you're on the correct network

---

Built with ❤️ for Lisk Sepolia
