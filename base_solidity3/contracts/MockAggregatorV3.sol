//SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * MockAggregatorV3 模拟聚合器合约
 */
contract MockAggregatorV3 is AggregatorV3Interface {
    int256 private _latestAnswer;
    uint8 private _decimals;


    constructor(int256 initialAnswer, uint8 decimals_) {
        _latestAnswer = initialAnswer;
        _decimals = decimals_;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external pure override returns (string memory) {
        return "Mock Aggregator";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 /* _roundId */
    )
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, _latestAnswer, 0, 0  , 0);
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, _latestAnswer, 0, 0, 0);
    }
}
