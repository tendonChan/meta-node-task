// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "./NftAuctionFactory.sol";
//拍卖工厂合约
contract NftAuctionFactoryV2 is NftAuctionFactory {
   function factoryV2() public pure returns(string memory){
        return "factoryV2";
   }
}
