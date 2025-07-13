const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("NftAuction", function () {
    let deployer, seller, user1, user2;
    let tokenId = 1;
    let auctionAddress;
    let myNFTContract, nftFactoryContract;
    let startTime, duration, startPrice, startPriceTokenAddress;
    let eth2UsdContract, usdc2UsdContract;
    const ethTokenAddress = ethers.ZeroAddress;
    let myTokenContract,myTokenAddress;
    let nftAuctionContract;

    /**
     * 喂价,测试代币使用usdc喂价
     * eth/usd = 277081000000
     * usdc/usd = 99992718
     */
    let ethInitAnswer = ethers.parseUnits("2770.81", 8);
    let usdcInitAnswer = ethers.parseUnits("0.99992718", 8);
    beforeEach(async function () {
        [deployer, seller, user1, user2] = await ethers.getSigners();

        //部署预言机模拟合约
        const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
        eth2UsdContract = await MockAggregatorV3.deploy(ethInitAnswer, 8);
        await eth2UsdContract.waitForDeployment();
        usdc2UsdContract = await MockAggregatorV3.deploy(usdcInitAnswer, 8);
        await usdc2UsdContract.waitForDeployment();

        // 部署NFT合约
        const MyNFT = await ethers.getContractFactory("MyNFT");
        myNFTContract = await MyNFT.deploy();
        await myNFTContract.waitForDeployment();
        await myNFTContract.connect(deployer).mint(seller.address, tokenId);
        // 部署myToken代币合约
        const MyToken =await ethers.getContractFactory("MyToken");
        myTokenContract =await MyToken.deploy();
        await myTokenContract.waitForDeployment();
        myTokenAddress = await myTokenContract.getAddress();

        // 部署工厂合约
        const nftFactory = await ethers.getContractFactory("NftAuctionFactory");
        nftFactoryContract = await nftFactory.deploy();
        await nftFactoryContract.waitForDeployment();
        myNFTContract.connect(seller).setApprovalForAll(await nftFactoryContract.getAddress(), true);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        startTime = block.timestamp + 5;
        duration = 100;
        startPrice = ethers.parseUnits("1", 18);
        startPriceTokenAddress = ethers.ZeroAddress;
        //创建拍卖
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
        nftAuctionContract = await ethers.getContractAt("NftAuction", auctionAddress);
    });

    it("创建拍卖", async function () {
        expect(await nftAuctionContract.nftContractAddress()).to.equal(await myNFTContract.getAddress());
        expect(await nftAuctionContract.tokenId()).to.equal(tokenId);
        expect(await nftAuctionContract.seller()).to.equal(seller.address);
    });

    it("价格源管理", async function () {
        //分别设置eth/usd、usdc/uds价格
        await expect(nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress()))
            .to.emit(nftAuctionContract, "PriceFeedSet").withArgs(ethTokenAddress, await eth2UsdContract.getAddress());
        await expect(nftAuctionContract.connect(seller).setPriceFeed(myTokenAddress, await usdc2UsdContract.getAddress()))
            .to.emit(nftAuctionContract, "PriceFeedSet").withArgs(myTokenAddress, await usdc2UsdContract.getAddress());

        //校验eth/usd、usdc/uds价格
        expect(await nftAuctionContract.getChainlinkDataFeedLatestAnswer(ethTokenAddress)).to.equal(ethInitAnswer);
        expect(await nftAuctionContract.getChainlinkDataFeedLatestAnswer(myTokenAddress)).to.equal(usdcInitAnswer);
        //只有管理员可以设置价格源、不能设置零地址作为代币地址
        await expect(nftAuctionContract.connect(user1).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress())).to.be.revertedWith("Only seller can set price feed");
        await expect(nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, ethers.ZeroAddress)).to.be.revertedWith("Invalid price feed address");
    });

    describe("拍卖",function(){
        beforeEach(async function(){
            let tx = await nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress());
            await tx.wait();
            tx = await nftAuctionContract.connect(seller).setPriceFeed(myTokenAddress, await usdc2UsdContract.getAddress());
            await tx.wait();
        });

        it("应该允许用户用ETH出价", async function () {
            //user1出价
            const bidAmount = ethers.parseEther("1.2");
            await expect(nftAuctionContract.connect(user1).placeBid(ethTokenAddress,bidAmount,{ value: bidAmount }))
                .to.emit(nftAuctionContract, "BidPlaced").withArgs(user1.address, bidAmount,ethTokenAddress);
            expect(await nftAuctionContract.highestBidder()).to.equal(user1.address);
            expect(await nftAuctionContract.highestBid()).to.equal(bidAmount);

            //增加时间到结束拍卖
            const beforeBalance = await ethers.provider.getBalance(seller.address);
            await ethers.provider.send("evm_increaseTime", [duration + 1]);

            //结束拍卖，把NFT转给竞拍出价最高者，把加密币转给卖方
            await expect(nftAuctionContract.endAuction()).to.emit(nftAuctionContract, "AuctionEnded").withArgs(user1.address, bidAmount, ethTokenAddress);
            expect(await myNFTContract.ownerOf(tokenId)).to.equal(user1.address);
            expect(await myNFTContract.balanceOf(user1.address)).to.equal(1);
            expect(await myNFTContract.balanceOf(seller.address)).to.equal(0);
            const afterBalance = await ethers.provider.getBalance(seller.address);
            expect(afterBalance).to.be.equals(beforeBalance + bidAmount);
            expect(await nftAuctionContract.ended()).to.be.true;
        });

        it("应该允许用户用代币出价",async function(){
            //给测试账户转一些测试代币,并授权转账
            const initAmount = ethers.parseUnits("5000",await myTokenContract.decimals());
            await myTokenContract.transfer(user1.address,initAmount);
            await myTokenContract.transfer(user2.address,initAmount);
            await myTokenContract.connect(user1).approve(auctionAddress,initAmount);
            await myTokenContract.connect(user2).approve(auctionAddress,initAmount);

            const bidAmount1 = ethers.parseUnits("3000",await myTokenContract.decimals());
            const bidAmount2 = ethers.parseUnits("4000",await myTokenContract.decimals());

            //user1出价
            await expect(nftAuctionContract.connect(user1).placeBid(myTokenAddress,bidAmount1))
                .to.emit(nftAuctionContract, "BidPlaced").withArgs(user1.address, bidAmount1,myTokenAddress);
            expect(await myTokenContract.balanceOf(user1.address)).to.equal(initAmount - bidAmount1);
            expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(bidAmount1);
            //user2出价
            await expect(nftAuctionContract.connect(user2).placeBid(myTokenAddress,bidAmount2))
                .to.emit(nftAuctionContract, "BidPlaced").withArgs(user2.address, bidAmount2,myTokenAddress);
            expect(await myTokenContract.balanceOf(user1.address)).to.equal(initAmount);
            expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount-bidAmount2);
            expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(bidAmount2);
            expect(await nftAuctionContract.highestBid()).to.equal(bidAmount2);
            expect(await nftAuctionContract.highestBidder()).equals(user2.address);
            //增加时间结束拍卖
            await ethers.provider.send("evm_increaseTime", [duration + 1]);
            await expect(nftAuctionContract.endAuction()).to.emit(nftAuctionContract, "AuctionEnded").withArgs(user2.address, bidAmount2, myTokenAddress);
            expect(await myTokenContract.balanceOf(user1.address)).to.equal(initAmount);
            expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount-bidAmount2);
            expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(0);
            expect(await myTokenContract.balanceOf(seller.address)).to.equal(bidAmount2);

            expect(await myNFTContract.balanceOf(user2.address)).to.equal(1);
            expect(await myNFTContract.balanceOf(seller.address)).to.equal(0);
        });

        it("eth与代币交叉出价",async function(){
            //user1使用eth出价，user2使用代币出价
            const initAmount = ethers.parseUnits("5000",await myTokenContract.decimals());
            await myTokenContract.transfer(user2.address,initAmount);
            await myTokenContract.connect(user2).approve(auctionAddress,initAmount);

            const bidAmount = ethers.parseEther("1.2");
            const bidAmount2 = ethers.parseUnits("3500",await myTokenContract.decimals());
            //user1出价
            const beforeBalance = await ethers.provider.getBalance(auctionAddress);
            await expect(nftAuctionContract.connect(user1).placeBid(ethTokenAddress,bidAmount,{ value: bidAmount }))
                .to.emit(nftAuctionContract, "BidPlaced").withArgs(user1.address, bidAmount,ethTokenAddress);
            const afterBalance = await ethers.provider.getBalance(auctionAddress);
            expect(afterBalance).to.be.equals(beforeBalance + bidAmount);
            expect(await nftAuctionContract.highestBidder()).to.equal(user1.address);
            expect(await nftAuctionContract.highestBid()).to.equal(bidAmount);
            
            //user2出价
            await expect(nftAuctionContract.connect(user2).placeBid(myTokenAddress,bidAmount2))
                .to.emit(nftAuctionContract, "BidPlaced").withArgs(user2.address, bidAmount2,myTokenAddress);
            expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount-bidAmount2);
            expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(bidAmount2);
            expect(await nftAuctionContract.highestBid()).to.equal(bidAmount2);
            expect(await nftAuctionContract.highestBidder()).equals(user2.address);

            //增加时间结束拍卖
            await ethers.provider.send("evm_increaseTime", [duration + 1]);
            await expect(nftAuctionContract.endAuction()).to.emit(nftAuctionContract, "AuctionEnded").withArgs(user2.address, bidAmount2, myTokenAddress);
            expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount-bidAmount2);
            expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(0);
            expect(await myTokenContract.balanceOf(seller.address)).to.equal(bidAmount2);
            expect(await myNFTContract.balanceOf(user2.address)).to.equal(1);
            expect(await myNFTContract.balanceOf(seller.address)).to.equal(0);
        });
    });
});