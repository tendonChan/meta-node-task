const { ethers, deployments } = require("hardhat");
const {expect} = require("chai");

describe("Starting", async function () {
    it("Should be able to deploy", async function () {
        [deployer, seller, user1, user2] = await ethers.getSigners();
        await deployments.fixture("deployNftAuction");
        const nftAuctionProxy = await deployments.get("NftAuctionProxy");
        const nftAuction = await ethers.getContractAt("NftAuction", nftAuctionProxy.address);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        startTime = block.timestamp + 5;
        duration = 100;
        startPrice = ethers.parseUnits("1", 18);
        startPriceTokenAddress = ethers.ZeroAddress;
        //创建拍卖
        await nftAuction.initialize(
            seller.address,
            startTime,
            duration,
            startPrice,
            ethers.ZeroAddress,
            nftAuctionProxy.address,
            1
        );
        const implAddress = await upgrades.erc1967.getImplementationAddress(nftAuctionProxy.address);
        expect(await nftAuction.startPrice()).to.equal(startPrice);
        expect(await nftAuction.startTime()).to.equal(startTime);

        await deployments.fixture("upgradeNftAuction");
        const nftAuction2 = await ethers.getContractAt("NftAuctionV2", nftAuctionProxy.address);
        const implAddress2 = await upgrades.erc1967.getImplementationAddress(nftAuctionProxy.address);
        console.log("implAddress1:", implAddress,"\nimplAddress2:", implAddress2);
        console.log("hello:", await nftAuction2.upgradeTest());
        expect(await nftAuction.startTime()).to.equal(await nftAuction2.startTime());
    });
})