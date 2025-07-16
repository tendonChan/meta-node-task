const { ethers } = require("hardhat");
const { expect } = require("chai");
const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");
const fs = require('fs');
const path = require("path");

describe("myTest", function () {
    it("Should have the correct name and symbol", async function () {
        [deployer, seller, user1] = await ethers.getSigners();

        //读取.cache/NftAuction.json文件
        const storePath = path.resolve(__dirname, "../deploy/.cache/NftAuction.json");
        const data = fs.readFileSync(storePath, 'utf8');
        const { proxyAddress, implementationAddress, myTokenAddress, nftAddress, abi } = JSON.parse(data);


        const auctionFactory = await ethers.getContractAt("NftAuctionFactoryV2", proxyAddress);
        const myToken = await ethers.getContractAt("MyToken", myTokenAddress);
        const myNFT = await ethers.getContractAt("MyNFT", nftAddress);

        expect(await myToken.name()).to.eq("myToken");
        expect(await myToken.symbol()).to.eq("MTK");
        expect(await myToken.totalSupply()).to.eq(ethers.parseUnits("10000", 18));

        expect(await myNFT.name()).to.eq("MyNFT");
        expect(await myNFT.symbol()).to.eq("MNFT");
        expect(await upgrades.erc1967.getImplementationAddress(proxyAddress)).to.be.eq(implementationAddress);
        const factory = await ethers.getContractAt("NftAuctionFactory",proxyAddress);
        console.log(await auctionFactory.auctionBeacon());
        console.log("impl:",await factory.auctionBeacon());
        
        console.log("auctionAddress:",await auctionFactory.getAuction(1));
        const auctionAddress = await auctionFactory.getAuction(1);
        const auction = await ethers.getContractAt("NftAuctionV2", auctionAddress);
        console.log("startPrice:",await auction.startPrice());
        expect(await auction.nftContractAddress()).to.be.eq(nftAddress);

        expect(typeof auction.upgradeTest === 'function').to.be.true;
        expect(typeof auctionFactory.factoryV2 === 'function').to.be.true;

        // let tx = await myNFT.connect(seller).setApprovalForAll(await auctionFactory.getAddress(), true);
        // await tx.wait();
        // const block = await ethers.provider.getBlock("latest");
        // const startTime = block.timestamp + 100;
        // const duration = 1000;
        // const startPrice = 100;
        // const startPriceTokenAddress = ethers.ZeroAddress;
        // const tokenId = 1;
        // tx = await auctionFactory.connect(seller).createAuction(
        //     startTime,
        //     duration,
        //     startPrice,
        //     startPriceTokenAddress,
        //     nftAddress,
        //     tokenId
        // );
        // const auctionReceipt = await tx.wait();
        // const event = auctionReceipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
        // expect(event).to.not.be.undefined;
        // const auctionAddr = await auctionFactory.getAuction(tokenId);
        // expect(event.args[0]).to.equal(auctionAddr);
    });
});