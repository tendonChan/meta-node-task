// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract NftAuction {
    address public seller;
    uint256 public duration;
    uint256 public startPrice;
    uint256 public startTime;
    address public startPriceTokenAddress;

    bool ended;
    address highestBidder;
    uint256 highestBid;
    address highestTokenAddress;

    address public nftContractAddress;
    uint256 public tokenId;
    
    mapping(address => AggregatorV3Interface) priceFeeds;

    event AuctionInitialize(
        address indexed seller,
        uint256 startTime,
        uint256 duration,
        uint256 startPrice,
        address startPriceTokenAddress,
        address nftContractAddress,
        uint256 tokenId
    );

    event BidPlaced(
        address indexed bidder,
        uint256 amount,
        address tokenAddress
    );

    event AuctionEnded(
        address indexed winner,
        uint256 amount,
        address tokenAddress
    );
    // Initialize the auction with parameters
    function initialize(address seller_,uint256 startTime_,uint duration_,uint256 startPrice_,address startPriceTokenAddress_,address nftContractAddress_,uint256 tokenId_) public {
        require(seller_ != address(0), "Invalid seller address");
        require(startTime_ > block.timestamp, "Start time must be in the future");
        require(duration_ > 0, "Duration must be greater than zero");
        require(startPrice_ > 0, "Start price must be greater than zero");
        require(nftContractAddress_ != address(0), "Invalid NFT contract address");
        seller = seller_;
        startTime = startTime_;
        duration = duration_;
        startPrice = startPrice_;
        startPriceTokenAddress = startPriceTokenAddress_;
        nftContractAddress = nftContractAddress_;
        tokenId = tokenId_;
        emit AuctionInitialize(seller, startTime, duration, startPrice, startPriceTokenAddress, nftContractAddress, tokenId);
    }
    // Set the Chainlink data feed for a specific token address
    function setChainlinkDataFeed(address tokenAddress, address priceFeedAddress) public {
        require(msg.sender == seller, "Only seller can set price feed");
        priceFeeds[tokenAddress] = AggregatorV3Interface(priceFeedAddress);
    }
    // Get the latest price from the Chainlink data feed for a specific token address
    function getChainlinkDataFeedLatestAnswer(address tokenAddress) public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = priceFeeds[tokenAddress].latestRoundData();
        return answer;
    }
    // Auction bidding
    function placeBid(address tokenAddress,uint256 amount) external payable {
        require(!ended && block.timestamp < duration + startTime, "Auction has ended");
        require(msg.value > highestBid && msg.value > startPrice, "Bid must be higher than current highest bid and start price");

        if(tokenAddress == address(0)){
            amount = msg.value;
        }
        uint256 payValue = amount * uint256(getChainlinkDataFeedLatestAnswer(tokenAddress));
        if(highestBid == 0){
            uint256 startPriceValue = startPrice * uint256(getChainlinkDataFeedLatestAnswer(startPriceTokenAddress));
            require(payValue > startPriceValue, "Bid must be higher than start price in token value");
        }else{
            uint256 highestBidValue = highestBid * uint256(getChainlinkDataFeedLatestAnswer(highestTokenAddress));
            require(payValue > highestBidValue, "Bid must be higher than current highest bid in token value");
        }

        if(highestBidder != address(0)){
            if(highestTokenAddress != address(0)){
                // Refund the previous highest bidder in the token they used
                IERC20(highestTokenAddress).transfer(highestBidder, highestBid);
            }else{
                payable(highestBidder).transfer(highestBid);
            }
        }
        
        highestBidder = msg.sender;
        highestBid = amount;
        highestTokenAddress = tokenAddress;

        emit BidPlaced(msg.sender, amount, tokenAddress);
    }
    // End the auction and transfer the NFT to the highest bidder
    function endAuction() external {
        require(!ended, "Auction already ended");
        require(block.timestamp >= startTime + duration, "Auction not yet ended");

        ended = true;
        if(highestBidder != address(0)){
            IERC721(nftContractAddress).safeTransferFrom(seller, highestBidder, tokenId);
            if(highestTokenAddress != address(0)){
                IERC20(highestTokenAddress).transfer(seller, highestBid);
            }else{
                payable(seller).transfer(highestBid);
            }
        }
        emit AuctionEnded(highestBidder, highestBid, highestTokenAddress);
    }

}
