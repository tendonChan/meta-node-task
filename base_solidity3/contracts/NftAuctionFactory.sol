// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./NftAuction.sol";
//拍卖工厂合约
contract NftAuctionFactory is Initializable {
    address[] public auctions;

    mapping (uint256 tokenId => NftAuction) public auctionMap;

    event AuctionCreated(address indexed auctionAddress,uint256 tokenId);

    function init() public  initializer{}

    // Create a new auction
    function createAuction(
        uint256 startTime,
        uint256 duration,
        uint256 startPrice,
        address startPriceTokenAddress,
        address nftContractAddress,
        uint256 tokenId
    ) external returns (address) {
        NftAuction auction = new NftAuction();
        auction.initialize(
            msg.sender,
            startTime,
            duration,
            startPrice,
            startPriceTokenAddress,
            nftContractAddress,
            tokenId
        );
        auctions.push(address(auction));
        auctionMap[tokenId] = auction;
        IERC721(nftContractAddress).approve(address(auction), tokenId);
        emit AuctionCreated(address(auction), tokenId);
        return address(auction);
    }

    function getAuctions() external view returns (address[] memory) {
        return auctions;
    }

    function getAuction(uint256 tokenId) external view returns (address) {
        require(tokenId < auctions.length, "tokenId out of bounds");
        return auctions[tokenId];
    }
}
