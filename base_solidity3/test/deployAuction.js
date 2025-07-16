const { ethers, deployments } = require("hardhat");
const {expect} = require("chai");

describe("Starting", async function () {
    it("Should be able to deploy", async function () {
        [deployer, seller, user1, user2] = await ethers.getSigners();
        await deployments.fixture("deployNftAuction");
       
        let ethInitAnswer = ethers.parseUnits("2770.81", 8);
        let usdcInitAnswer = ethers.parseUnits("0.99992718", 8);
        //部署预言机模拟合约
        const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
        const eth2UsdContract = await MockAggregatorV3.deploy(ethInitAnswer, 8);
        await eth2UsdContract.waitForDeployment();
        const usdc2UsdContract = await MockAggregatorV3.deploy(usdcInitAnswer, 8);
        await usdc2UsdContract.waitForDeployment();

        const deployAuctionInfo = await deployments.get("NftAuction");
        const deployMyTokenInfo = await deployments.get("MyToken");
        const deployMyNFTInfo = await deployments.get("MyNFT");

        const auctionFactoryProxyAddr = deployAuctionInfo.address;
        const myNFTAddr = deployMyNFTInfo.address;
        const myTokenAddr = deployMyTokenInfo.address;
        const auctionFactory = await ethers.getContractAt("NftAuctionFactory",auctionFactoryProxyAddr);
        console.log("proxyAddress:",auctionFactoryProxyAddr,await auctionFactory.getAddress()
        ,await upgrades.erc1967.getImplementationAddress(auctionFactoryProxyAddr));
        const myToken = await ethers.getContractAt("MyToken",myTokenAddr);
        const myNFT = await ethers.getContractAt("MyNFT",myNFTAddr);

        expect(await myToken.name()).to.eq("myToken");
        expect(await myToken.symbol()).to.eq("MTK");
        expect(await myToken.totalSupply()).to.eq(ethers.parseUnits("10000", 18));

        expect(await myNFT.name()).to.eq("MyNFT");
        expect(await myNFT.symbol()).to.eq("MNFT");
        
        myNFT.connect(seller).setApprovalForAll(await auctionFactory.getAddress(), true);
        const block = await ethers.provider.getBlock("latest");
        const startTime = block.timestamp + 5;
        const duration = 100;
        const startPrice = ethers.parseUnits("1", 18);
        const startPriceTokenAddress = ethers.ZeroAddress;
        const tokenId = 1;
        let tx = await auctionFactory.connect(seller).createAuction(
            startTime,
            duration,
            startPrice,
            startPriceTokenAddress,
            myNFTAddr,
            tokenId
        );
        const auctionReceipt = await tx.wait();
        const event = auctionReceipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
        expect(event).to.not.be.undefined;
        const auctionAddr = await auctionFactory.getAuction(tokenId);
        expect(event.args[0]).to.equal(auctionAddr);

        const ethTokenAddress = ethers.ZeroAddress;
        const auction = await ethers.getContractAt("NftAuction",auctionAddr);
        tx = await auction.connect(seller).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress());
        await tx.wait();
        tx = await auction.connect(seller).setPriceFeed(myTokenAddr, await usdc2UsdContract.getAddress());
        await tx.wait();

        const bidAmount = ethers.parseEther("1.2");
        await expect(auction.connect(user1).placeBid(ethTokenAddress, bidAmount, { value: bidAmount }))
            .to.emit(auction, "BidPlaced").withArgs(user1.address, bidAmount, ethTokenAddress);
        expect(await auction.highestBidder()).to.equal(user1.address);
        expect(await auction.highestBid()).to.equal(bidAmount);
    });
})