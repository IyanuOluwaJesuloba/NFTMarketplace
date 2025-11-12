export const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '';
export const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '';
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 4202;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia-api.lisk.com';

export const LISK_SEPOLIA = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: 'Lisk Sepolia',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ['https://sepolia-blockscout.lisk.com'],
};

export const NFT_ABI = [
  "function mint(string memory tokenURI) public returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function approve(address to, uint256 tokenId) public",
  "function getApproved(uint256 tokenId) public view returns (address)",
  "function getCurrentTokenId() public view returns (uint256)"
];

export const MARKETPLACE_ABI = [
  "function listNFT(address nftContract, uint256 tokenId, uint256 priceInWei) external returns (uint256)",
  "function buyNFT(uint256 listingId) external payable",
  "function cancelListing(uint256 listingId) external",
  "function getListing(uint256 listingId) external view returns (address seller, address nftContract, uint256 tokenId, uint256 priceInWei, uint256 priceInUSD, bool active)",
  "function getTotalListings() external view returns (uint256)",
  "function getUSDPrice(uint256 weiAmount) public view returns (uint256)",
  "function getLatestPrice() public view returns (int256)",
  "event NFTListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 priceInWei, uint256 priceInUSD)",
  "event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 priceInWei, uint256 priceInUSD)",
  "event ListingCancelled(uint256 indexed listingId)"
];
