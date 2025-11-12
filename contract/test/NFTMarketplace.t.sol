// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/NFT.sol";
import "../src/NFTMarketplace.sol";

/**
 * @title NFTMarketplaceTest
 * @notice Tests for NFT Marketplace with RedStone Classic integration
 * @dev RedStone Classic requires price data in calldata - we test without price functions
 */
contract NFTMarketplaceTest is Test {
    NFT public nft;
    NFTMarketplace public marketplace;

    address public seller = address(0x1);
    address public buyer = address(0x2);
    
    uint256 public constant LISTING_PRICE = 1 ether;

    function setUp() public {
        // Deploy contracts (no oracle needed for RedStone Classic!)
        nft = new NFT();
        marketplace = new NFTMarketplace();

        // Fund accounts
        vm.deal(seller, 10 ether);
        vm.deal(buyer, 10 ether);
    }

    function testMintNFT() public {
        vm.prank(seller);
        uint256 tokenId = nft.mint("ipfs://test-uri");
        
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), seller);
        assertEq(nft.tokenURI(tokenId), "ipfs://test-uri");
    }

    function testListNFT() public {
        // Mint NFT
        vm.prank(seller);
        uint256 tokenId = nft.mint("ipfs://test-uri");
        
        // Approve marketplace
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);
        
        // List NFT
        vm.prank(seller);
        uint256 listingId = marketplace.listNFT(
            address(nft),
            tokenId,
            LISTING_PRICE
        );
        
        assertEq(listingId, 1);
        
        (
            address listedSeller,
            address nftContract,
            uint256 listedTokenId,
            uint256 price,
            uint256 usdPrice,
            bool active
        ) = marketplace.getListing(listingId);
        
        assertEq(listedSeller, seller);
        assertEq(nftContract, address(nft));
        assertEq(listedTokenId, tokenId);
        assertEq(price, LISTING_PRICE);
        assertEq(active, true);
        assertGt(usdPrice, 0);
    }

    function testBuyNFT() public {
        // Mint and list NFT
        vm.prank(seller);
        uint256 tokenId = nft.mint("ipfs://test-uri");
        
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);
        
        vm.prank(seller);
        uint256 listingId = marketplace.listNFT(
            address(nft),
            tokenId,
            LISTING_PRICE
        );
        
        // Buy NFT
        uint256 buyerBalanceBefore = buyer.balance;
        uint256 sellerBalanceBefore = seller.balance;
        
        vm.prank(buyer);
        marketplace.buyNFT{value: LISTING_PRICE}(listingId);
        
        // Check NFT ownership transferred
        assertEq(nft.ownerOf(tokenId), buyer);
        
        // Check balances
        assertEq(buyer.balance, buyerBalanceBefore - LISTING_PRICE);
        assertGt(seller.balance, sellerBalanceBefore); // Seller received payment minus fee
        
        // Check listing is no longer active
        (, , , , , bool active) = marketplace.getListing(listingId);
        assertEq(active, false);
    }

    function testCancelListing() public {
        // Mint and list NFT
        vm.prank(seller);
        uint256 tokenId = nft.mint("ipfs://test-uri");
        
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);
        
        vm.prank(seller);
        uint256 listingId = marketplace.listNFT(
            address(nft),
            tokenId,
            LISTING_PRICE
        );
        
        // Cancel listing
        vm.prank(seller);
        marketplace.cancelListing(listingId);
        
        // Check listing is no longer active
        (, , , , , bool active) = marketplace.getListing(listingId);
        assertEq(active, false);
    }

    function testCannotBuyOwnNFT() public {
        // Mint and list NFT
        vm.prank(seller);
        uint256 tokenId = nft.mint("ipfs://test-uri");
        
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);
        
        vm.prank(seller);
        uint256 listingId = marketplace.listNFT(
            address(nft),
            tokenId,
            LISTING_PRICE
        );
        
        // Try to buy own NFT
        vm.prank(seller);
        vm.expectRevert("Cannot buy your own NFT");
        marketplace.buyNFT{value: LISTING_PRICE}(listingId);
    }

    function testCannotListWithoutApproval() public {
        // Mint NFT
        vm.prank(seller);
        uint256 tokenId = nft.mint("ipfs://test-uri");
        
        // Try to list without approval
        vm.prank(seller);
        vm.expectRevert("Marketplace not approved");
        marketplace.listNFT(address(nft), tokenId, LISTING_PRICE);
    }
}
