// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceConsumer.sol";

/**
 * @title NFTMarketplace
 * @dev NFT Marketplace with RedStone Classic price feeds (pull model)
 * @notice Price data is passed in transaction calldata using RedStone SDK
 */
contract NFTMarketplace is ReentrancyGuard, Ownable, PriceConsumer {
    
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 priceInWei;
        bool active;
    }

    // RedStone data feed ID for ETH/USD
    bytes32 public constant ETH_FEED_ID = bytes32("ETH");
    
    // Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;
    
    // Counter for listing IDs
    uint256 private _listingIdCounter;
    
    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    
    // Price staleness threshold (e.g., 10 minutes for RedStone)
    uint256 public maxPriceAge = 600;
    
    // Events
    event NFTListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 priceInWei,
        uint256 priceInUSD
    );
    
    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 priceInWei,
        uint256 priceInUSD
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    event PlatformFeeUpdated(uint256 newFee);

    /**
     * @dev Constructor
     * @notice No oracle address needed - prices come from calldata!
     */
    constructor() Ownable(msg.sender) {
        // RedStone Classic doesn't need oracle address
        // Prices are passed in transaction calldata
    }

    /**
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param priceInWei Price in Wei
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 priceInWei
    ) external nonReentrant returns (uint256) {
        require(priceInWei > 0, "Price must be greater than 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            priceInWei: priceInWei,
            active: true
        });

        uint256 priceInUSD = getUSDPrice(priceInWei);

        emit NFTListed(
            listingId,
            msg.sender,
            nftContract,
            tokenId,
            priceInWei,
            priceInUSD
        );

        return listingId;
    }

    /**
     * @dev Buy an NFT from the marketplace
     * @param listingId ID of the listing
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(msg.value == listing.priceInWei, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        IERC721 nft = IERC721(listing.nftContract);
        require(nft.ownerOf(listing.tokenId) == listing.seller, "Seller no longer owns NFT");

        // Calculate fees
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 sellerProceeds = msg.value - fee;

        // Mark as inactive
        listing.active = false;

        // Transfer NFT to buyer
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // Transfer funds to seller
        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success, "Transfer to seller failed");

        uint256 priceInUSD = getUSDPrice(listing.priceInWei);

        emit NFTSold(
            listingId,
            msg.sender,
            listing.seller,
            listing.priceInWei,
            priceInUSD
        );
    }

    /**
     * @dev Cancel a listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Only seller can cancel");

        listing.active = false;

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Get the latest ETH/USD price from RedStone calldata
     * @notice Price data must be appended to transaction calldata
     * @return price Latest price with 8 decimals
     */
    function getLatestPrice() public view returns (uint256) {
        // Get price from RedStone calldata
        uint256 price = PriceConsumer.getLatestPrice(ETH_FEED_ID);
        require(price > 0, "Invalid price from RedStone");
        
        // Check price freshness
        uint256 timestamp = getTimestamp();
        require(block.timestamp - timestamp <= maxPriceAge, "Price data is stale");
        
        return price;
    }

    /**
     * @dev Convert Wei amount to USD (with 8 decimals)
     * @param weiAmount Amount in Wei
     * @return USD value with 8 decimals
     */
    function getUSDPrice(uint256 weiAmount) public view returns (uint256) {
        uint256 ethUsdPrice = getLatestPrice();
        
        // Price has 8 decimals, ETH has 18 decimals
        // Result will have 8 decimals
        uint256 usdPrice = (weiAmount * ethUsdPrice) / 1e18;
        
        return usdPrice;
    }

    /**
     * @dev Get listing details
     * @param listingId ID of the listing
     */
    function getListing(uint256 listingId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 priceInWei,
        uint256 priceInUSD,
        bool active
    ) {
        Listing memory listing = listings[listingId];
        uint256 usdPrice = 0;

        if (listing.active) {
            try this.getUSDPrice(listing.priceInWei) returns (uint256 computedPrice) {
                usdPrice = computedPrice;
            } catch {
                usdPrice = 0;
            }
        }
        
        return (
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.priceInWei,
            usdPrice,
            listing.active
        );
    }

    /**
     * @dev Update platform fee (only owner)
     * @param newFee New fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get total number of listings
     */
    function getTotalListings() external view returns (uint256) {
        return _listingIdCounter;
    }

    /**
     * @dev Update max price age threshold (only owner)
     * @param newMaxAge New max age in seconds
     */
    function updateMaxPriceAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge > 0, "Invalid max age");
        maxPriceAge = newMaxAge;
    }
}
