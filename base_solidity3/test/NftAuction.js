const {ethers} = require("hardhat");
const {expect} = require("chai");

describe("NftAuction", function () {
    let deployer, seller, user2, user3;
    let tokenId = 1;
    let auctionAddress;
    let myNFTContract,nftFactoryContract;
    let startTime, duration, startPrice, startPriceTokenAddress;
    beforeEach(async function () {
        [deployer, seller, user2, user3] = await ethers.getSigners();
        const MyNFT = await ethers.getContractFactory("MyNFT");
        myNFTContract = await MyNFT.deploy();
        await myNFTContract.connect(deployer).mint(seller.address, tokenId);

        const nftFactory = await ethers.getContractFactory("NftAuctionFactory");
        nftFactoryContract = await nftFactory.deploy();

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        startTime = block.timestamp  + 2;
        duration = 100;
        startPrice = ethers.parseUnits("1", 18);
        startPriceTokenAddress = ethers.ZeroAddress;
        const tx = await nftFactoryContract.connect(seller).createAuction(
            startTime,
            duration,
            startPrice,
            startPriceTokenAddress,
            myNFTContract.getAddress(),
            tokenId
        );
        const auctionReceipt = await tx.wait();
        const event = auctionReceipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
        auctionAddress = event.args[0];
    });

    it("Should create an auction", async function () {

        const nftAuctionContract = await ethers.getContractAt("NftAuction", auctionAddress);
        console.log("Auction Address:", await nftAuctionContract.getAddress());
        console.log("NFT Contract Address:", await nftAuctionContract.nftContractAddress());
        
        expect(await nftAuctionContract.nftContractAddress()).to.equal(await myNFTContract.getAddress());
        expect(await nftAuctionContract.tokenId()).to.equal(tokenId);
        expect(await nftAuctionContract.seller()).to.equal(seller.address);

        await nftAuctionContract.connect(seller).setChainlinkDataFeed(ethers.ZeroAddress, "0x694AA1769357215DE4FAC081bf1f309aDC325306");
        console.log("getChainlinkDataFeedLatestAnswer:",await nftAuctionContract.getChainlinkDataFeedLatestAnswer(ethers.ZeroAddress));
    });
});