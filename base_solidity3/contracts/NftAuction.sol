// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract NftAuction is Initializable {
    address public seller;
    uint256 public duration;
    uint256 public startPrice;
    uint256 public startTime;
    address public startPriceTokenAddress;

    bool public ended;
    address public highestBidder;
    uint256 public highestBid;
    address public highestTokenAddress;

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
    event PriceFeedSet(
        address indexed tokenAddress,
        address priceFeedAddress
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

    function init() public  initializer{}

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
    function setPriceFeed(address tokenAddress, address priceFeedAddress) public {
        require(msg.sender == seller, "Only seller can set price feed");
        require(priceFeedAddress != address(0),"Invalid price feed address");
        priceFeeds[tokenAddress] = AggregatorV3Interface(priceFeedAddress);
        emit PriceFeedSet(tokenAddress, priceFeedAddress);
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
        
        if(tokenAddress == address(0)){
            require(msg.value > highestBid && msg.value > startPrice, "Bid must be higher than current highest bid and start price");
            amount = msg.value;
        }else{
            require(amount > highestBid && amount > startPrice, "Bid must be higher than current highest bid and start price");
        }
        uint256 payValue = convertUnit(tokenAddress, amount);
        if(highestBid == 0){
            uint256 startPriceValue = convertUnit(startPriceTokenAddress, startPrice);
            require(payValue > startPriceValue, "Bid must be higher than start price in token value");
        }else{
            uint256 highestBidValue = convertUnit(highestTokenAddress, highestBid);
            require(payValue > highestBidValue, "Bid must be higher than current highest bid in token value");
        }
        //Refund the previous highest bidder in the token they used
        if(highestBidder != address(0)){
            if(highestTokenAddress != address(0)){
                IERC20(highestTokenAddress).transfer(highestBidder, highestBid);
            }else{
                payable(highestBidder).transfer(highestBid);
            }
        }
        //Transfer the token from current bidder to this contract
        if(tokenAddress != address(0)){
            IERC20(tokenAddress).transferFrom(msg.sender,address(this),amount);
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

    function convertUnit(address tokenAddress, uint256 amount) public view returns (uint256) {
        uint8 decimals;
        if(tokenAddress == address(0)){
            decimals = 18;
        }else{
            decimals = ERC20(tokenAddress).decimals();
        }
        int256 price = getChainlinkDataFeedLatestAnswer(tokenAddress);
        return amount * uint256(price) / (10 ** decimals);
    }
}
