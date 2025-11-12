// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/NFT.sol";
import "../src/NFTMarketplace.sol";

/**
 * @title DeployWithMockOracleScript
 * @notice Deploy NFT Marketplace - same as Deploy.s.sol for RedStone Classic
 * @dev RedStone Classic doesn't need separate mock deployment
 * @dev Price data comes from calldata in both test and production
 */
contract DeployWithMockOracleScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying NFT Marketplace with RedStone Classic...");
        console.log("Note: For testing, wrap transactions with mock RedStone data in frontend");

        // Deploy NFT Contract
        NFT nft = new NFT();
        console.log("NFT Contract deployed at:", address(nft));

        // Deploy Marketplace Contract
        NFTMarketplace marketplace = new NFTMarketplace();
        console.log("Marketplace Contract deployed at:", address(marketplace));

        console.log("\nTesting: Use RedStone SDK with mock data service in frontend");
        console.log("Production: Use RedStone SDK with production data service");

        vm.stopBroadcast();
    }
}
