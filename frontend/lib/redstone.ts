/**
 * RedStone Oracle Integration
 * Wraps contract calls with price data from RedStone
 */

import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";

/**
 * Wrap a contract with RedStone production data service
 * @param contract The ethers contract instance to wrap
 * @returns Wrapped contract that automatically includes price data
 */
export async function wrapContractWithRedStone(contract: Contract): Promise<Contract> {
  try {
    console.log("Wrapping contract with RedStone:", contract);
    
    if (!contract) {
      throw new Error("Contract is null or undefined");
    }
    
    if (!contract.target) {
      throw new Error("Contract address is missing");
    }
    
    console.log("Contract address:", contract.target);
    console.log("Contract interface:", contract.interface);
    
    // For now, return the original contract without RedStone wrapping
    // TODO: Fix RedStone compatibility with ethers v6
    console.warn("RedStone wrapper temporarily disabled due to ethers v6 compatibility issues");
    return contract;
    
    // Original RedStone code (commented out until compatibility is fixed):
    // return WrapperBuilder.wrap(contract).usingDataService({
    //   dataServiceId: "redstone-primary-prod",
    //   uniqueSignersCount: 1,
    //   dataFeeds: ["ETH"],
    // });
  } catch (error) {
    console.error("Error wrapping contract with RedStone:", error);
    throw new Error("Failed to initialize RedStone wrapper");
  }
}

/**
 * Wrap a contract with RedStone demo/test data service
 * Use this for testing without real price data
 * @param contract The ethers contract instance to wrap
 * @returns Wrapped contract with mock price data
 */
export async function wrapContractWithMockRedStone(contract: Contract): Promise<Contract> {
  try {
    console.warn("Mock RedStone wrapper temporarily disabled due to ethers v6 compatibility issues");
    return contract;
    
    // Original RedStone code (commented out until compatibility is fixed):
    // return WrapperBuilder.wrap(contract).usingDataService({
    //   dataServiceId: "redstone-main-demo",
    //   uniqueSignersCount: 1,
    //   dataFeeds: ["ETH"],
    // });
  } catch (error) {
    console.error("Error wrapping contract with mock RedStone:", error);
    throw new Error("Failed to initialize mock RedStone wrapper");
  }
}

/**
 * Fetch current ETH price from RedStone API
 * Use this for display purposes (read-only)
 * @returns ETH price in USD with 8 decimals
 */
export async function fetchETHPriceFromRedStone(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.redstone.finance/prices?symbols=ETH&provider=redstone-primary-prod'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.ETH || !data.ETH.value) {
      throw new Error("Invalid response from RedStone API");
    }
    
    // RedStone API returns price with proper decimals
    return data.ETH.value;
  } catch (error) {
    console.error("Error fetching ETH price from RedStone:", error);
    throw new Error("Failed to fetch ETH price");
  }
}

/**
 * Convert Wei to USD using current ETH price
 * @param weiAmount Amount in Wei (string to handle big numbers)
 * @returns USD value with 2 decimals
 */
export async function convertWeiToUSD(weiAmount: string): Promise<string> {
  try {
    const ethPrice = await fetchETHPriceFromRedStone();
    const ethAmount = parseFloat(weiAmount) / 1e18;
    const usdValue = ethAmount * ethPrice;
    return usdValue.toFixed(2);
  } catch (error) {
    console.error("Error converting Wei to USD:", error);
    return "0.00";
  }
}

/**
 * Format price for display
 * @param priceInWei Price in Wei
 * @param ethPrice Current ETH price in USD
 * @returns Formatted string with ETH and USD
 */
export function formatPrice(priceInWei: string, ethPrice: number): string {
  const ethAmount = parseFloat(priceInWei) / 1e18;
  const usdAmount = ethAmount * ethPrice;
  
  return `${ethAmount.toFixed(4)} ETH ($${usdAmount.toFixed(2)})`;
}
