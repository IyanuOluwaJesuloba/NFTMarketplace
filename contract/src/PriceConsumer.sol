// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrimaryProdDataServiceConsumerBase} from "../lib/redstone-oracles-monorepo/packages/evm-connector/contracts/data-services/PrimaryProdDataServiceConsumerBase.sol";

/**
 * @title PriceConsumer
 * @notice Consumes RedStone Classic price data appended to calldata by the RedStone SDK
 */
contract PriceConsumer is PrimaryProdDataServiceConsumerBase {
    uint8 public constant REQUIRED_SIGNERS = 1;
    bytes32 public constant DEFAULT_DATA_FEED_ID = bytes32("ETH");

    /**
     * @notice Returns the latest price of an asset in USD with 8 decimals
     * @param dataFeedId The identifier for the price feed (e.g., bytes32("ETH"))
     * @return The price value with 8 decimals
     */
    function getLatestPrice(bytes32 dataFeedId) public view returns (uint256) {
        (uint256 price, ) = _getPriceAndTimestamp(dataFeedId);
        require(price > 0, "Invalid price from RedStone");
        return price;
    }

    /**
     * @notice Helper function to get price by symbol string
     * @param symbol The asset symbol (e.g., "ETH", "BTC")
     * @return The price value with 8 decimals
     */
    function getPriceBySymbol(string calldata symbol) external view returns (uint256) {
        return getLatestPrice(stringToBytes32(symbol));
    }

    /**
     * @notice Get timestamp (in seconds) for the default data feed
     * @return The timestamp of the price data in seconds
     */
    function getTimestamp() public view returns (uint256) {
        (, uint256 timestamp) = _getPriceAndTimestamp(DEFAULT_DATA_FEED_ID);
        return timestamp;
    }

    /**
     * @notice Convert string to bytes32
     * @param source String to convert
     * @return result Bytes32 representation
     */
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }

    function getUniqueSignersThreshold() public view override returns (uint8) {
        return REQUIRED_SIGNERS;
    }

    function _getPriceAndTimestamp(bytes32 dataFeedId) internal view returns (uint256 price, uint256 timestamp) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = dataFeedId;

        (uint256[] memory values, uint256 dataTimestampMs) = getOracleNumericValuesAndTimestampFromTxMsg(dataFeedIds);
        validateTimestamp(dataTimestampMs);

        require(values.length > 0, "No price returned");

        return (values[0], dataTimestampMs / 1000);
    }
}
