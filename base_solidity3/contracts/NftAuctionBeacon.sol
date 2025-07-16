// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract NftAuctionBeacon is UpgradeableBeacon{
    constructor(address _implementation) UpgradeableBeacon(_implementation,msg.sender) {}

    // function implementation() public view override returns (address) {
    //     return super.implementation();
    // }

    // function upgradeTo(address newImplementation) public override onlyOwner {
    //     super.upgradeTo(newImplementation);
    // }
}