// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MetaNodeStake.sol";

contract  MetaNodeStakeV2 is MetaNodeStake {
    function getVersion() public pure returns(string memory){
        return "MetaNodeStakeV2";
    }
}