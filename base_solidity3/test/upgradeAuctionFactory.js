const { ethers, deployments } = require("hardhat");
const {expect} = require("chai");

describe("Starting", async function () {
    it("Should be able to deploy", async function () {
        [deployer, seller, user1, user2] = await ethers.getSigners();
        await deployments.fixture("deployNftAuctionFactory");
        const nftAuctionFactoryProxy = await deployments.get("NftAuctionFactoryProxy");
        const nftAuctionFactory = await ethers.getContractAt("NftAuctionFactory", nftAuctionFactoryProxy.address);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        startTime = block.timestamp + 5;
        duration = 100;
        startPrice = ethers.parseUnits("1", 18);
        startPriceTokenAddress = ethers.ZeroAddress;
        //创建拍卖
        let tx = await nftAuctionFactory.createAuction(
            startTime,
            duration,
            startPrice,
            ethers.ZeroAddress,
            nftAuctionFactoryProxy.address,
            1
        );
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
        let auctionAddress = event.args[0];
        let nftAuctionContract = await ethers.getContractAt("NftAuction", auctionAddress);
        console.log("aaaa",await nftAuctionContract.startPrice());


        // const implAddress = await upgrades.erc1967.getImplementationAddress(nftAuctionProxy.address);
        // expect(await nftAuction.startPrice()).to.equal(startPrice);
        // expect(await nftAuction.startTime()).to.equal(startTime);

        await deployments.fixture("upgradeNftAuctionFactory");
        const nftAuctionFactory2 = await ethers.getContractAt("NftAuctionFactoryV2", nftAuctionFactoryProxy.address);
        // const implAddress2 = await upgrades.erc1967.getImplementationAddress(nftAuctionProxy.address);
        // console.log("implAddress1:", implAddress,"\nimplAddress2:", implAddress2);
        console.log("hello:", await nftAuctionFactory2.factoryV2());
        let nftAuctionContract2 = await ethers.getContractAt("NftAuctionV2", auctionAddress);
        console.log("aaaa",await nftAuctionContract2.upgradeTest());

        // expect(await nftAuction.startTime()).to.equal(await nftAuction2.startTime());
    });
})