// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PriceConsumer.sol";

/**
 * @title TestPriceConsumer
 * @dev Standalone PriceConsumer for testing purposes
 */
contract TestPriceConsumer is PriceConsumer {
    // Empty contract that just inherits PriceConsumer for testing
}

/**
 * @title DeployPriceConsumerScript
 * @notice Deploy standalone PriceConsumer for testing
 * @dev This is for testing only - normally PriceConsumer is inherited by NFTMarketplace
 */
contract DeployPriceConsumerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying standalone PriceConsumer for testing...");
        
        // Deploy test PriceConsumer
        TestPriceConsumer priceConsumer = new TestPriceConsumer();
        console.log("PriceConsumer deployed at:", address(priceConsumer));
        
        console.log("\n=== Test Deployment ===");
        console.log("Note: This is for testing only!");
        console.log("In production, PriceConsumer is inherited by NFTMarketplace");
        console.log("Use Deploy.s.sol for production deployment");
        console.log("========================\n");

        vm.stopBroadcast();
    }
}
