// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "./NftAuction.sol";
contract NftAuctionV2 is NftAuction {
    
    function upgradeTest() public pure returns(string memory){
        return "upgradeTest";
    }
}
