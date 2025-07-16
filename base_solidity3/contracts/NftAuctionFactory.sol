// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./NftAuction.sol";
//拍卖工厂合约
contract NftAuctionFactory is OwnableUpgradeable,UUPSUpgradeable {
    address[] public auctions;

    mapping (uint256 tokenId => address) public auctionMap;

    address public auctionBeacon;

    event AuctionCreated(address indexed auctionAddress,uint256 tokenId);

    function initialize(address _auctionBeacon) public  initializer{
        __Ownable_init();
        auctionBeacon = _auctionBeacon;
    }

    // UUPS升级授权函数，只有合约所有者能升级
    function _authorizeUpgrade(address) internal view override onlyOwner {}

    // Create a new auction
    function createAuction(
        uint256 startTime,
        uint256 duration,
        uint256 startPrice,
        address startPriceTokenAddress,
        address nftContractAddress,
        uint256 tokenId
    ) external returns (address) {
        bytes memory data = abi.encodeWithSelector(
            NftAuction.initialize.selector,
            msg.sender,
            startTime,
            duration,
            startPrice,
            startPriceTokenAddress,
            nftContractAddress,
            tokenId
        );
        BeaconProxy auction = new BeaconProxy(auctionBeacon,data);

        address auctionAddr = address(auction);
        auctions.push(auctionAddr);
        auctionMap[tokenId] = auctionAddr;
        IERC721(nftContractAddress).approve(auctionAddr, tokenId);
        emit AuctionCreated(auctionAddr, tokenId);
        return auctionAddr;
    }

    function getAuctions() external view returns (address[] memory) {
        return auctions;
    }

    function getAuction(uint256 tokenId) external view returns (address) {
        return auctionMap[tokenId];
    }
}
