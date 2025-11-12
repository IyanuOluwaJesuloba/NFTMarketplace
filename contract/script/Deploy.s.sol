// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/NFT.sol";
import "../src/NFTMarketplace.sol";

/**
 * @title DeployScript
 * @notice Deploy NFT Marketplace with RedStone Classic (pull model)
 * @dev No oracle address needed - prices passed in calldata via RedStone SDK
 */
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying NFT Marketplace with RedStone Classic integration...");
        
        // Deploy NFT Contract
        NFT nft = new NFT();
        console.log("NFT Contract deployed at:", address(nft));

        // Deploy Marketplace Contract (no oracle address needed!)
        NFTMarketplace marketplace = new NFTMarketplace();
        console.log("Marketplace Contract deployed at:", address(marketplace));
        
        console.log("\n=== Deployment Summary ===");
        console.log("NFT Address:", address(nft));
        console.log("Marketplace Address:", address(marketplace));
        console.log("Oracle Type: RedStone Classic (Pull Model)");
        console.log("Note: Use RedStone SDK to wrap transactions with price data");
        console.log("==========================\n");

        vm.stopBroadcast();
    }
}
