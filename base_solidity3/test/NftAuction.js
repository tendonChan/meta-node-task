const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("NftAuction", function () {
    let deployer, seller, user1, user2;
    let tokenId = 1;
    let nftAuctionFactory;
    let eth2UsdContract, usdc2UsdContract;
    const ethTokenAddress = ethers.ZeroAddress;
    let myTokenContract,myNFTContract;
    let NftAuction;
    let auctionBeaconAddr,auctionFactoryProxyAddr, myTokenAddress;

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
        myNFTContract = await MyNFT.deploy("MyNFT", "MNFT");
        await myNFTContract.waitForDeployment();
        await myNFTContract.connect(deployer).mint(seller.address, tokenId);
        // 部署myToken代币合约
        const MyToken = await ethers.getContractFactory("MyToken");
        myTokenContract = await MyToken.deploy("myToken", "MTK", ethers.parseUnits("10000", 18));
        await myTokenContract.waitForDeployment();
        myTokenAddress = await myTokenContract.getAddress();
        //部署NftAuctionBeacon合约(合约升级使用需要)
        NftAuction = await ethers.getContractFactory("NftAuction");
        const nftAuction = await NftAuction.deploy();

        const AuctionBeacon = await ethers.getContractFactory("NftAuctionBeacon");
        const auctionBeacon = await AuctionBeacon.deploy(await nftAuction.getAddress());
        auctionBeaconAddr = await auctionBeacon.getAddress();

        // 部署工厂合约(通过代理合约部署)
        const NftAuctionFactory = await ethers.getContractFactory("NftAuctionFactory");
        const auctionFactoryProxy = await upgrades.deployProxy(NftAuctionFactory, [auctionBeaconAddr], {
            initializer: 'initialize',
            kind: 'uups'
        });
        await auctionFactoryProxy.waitForDeployment();
        auctionFactoryProxyAddr = await auctionFactoryProxy.getAddress();
        nftAuctionFactory = await NftAuctionFactory.attach(auctionFactoryProxyAddr);

        tx = await myNFTContract.connect(seller).setApprovalForAll(await nftAuctionFactory.getAddress(), true);
        await tx.wait();
    });

    describe("工厂合约", function () {
        it("初始化校验", async function () {
            expect(await nftAuctionFactory.auctionBeacon()).to.be.equal(auctionBeaconAddr);
        });
        it("创建拍卖", async function () {
            const block = await ethers.provider.getBlock("latest");
            const startTime = block.timestamp + 5;
            const duration = 100;
            const startPrice = ethers.parseUnits("1", 18);
            const startPriceTokenAddress = ethers.ZeroAddress;
            const tokenId = 1;
            const tx = await nftAuctionFactory.connect(seller).createAuction(
                startTime,
                duration,
                startPrice,
                startPriceTokenAddress,
                myNFTContract.getAddress(),
                tokenId
            );
            const auctionReceipt = await tx.wait();
            const event = auctionReceipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            expect(event).to.not.be.undefined;
            expect(event.args[0]).to.equal(await nftAuctionFactory.getAuction(tokenId));
            const nftAuction = NftAuction.attach(event.args[0]);

            expect(await nftAuction.nftContractAddress()).to.equal(await myNFTContract.getAddress());
            expect(await nftAuction.tokenId()).to.equal(tokenId);
            expect(await nftAuction.seller()).to.equal(seller.address);
            expect(await nftAuction.startTime()).to.equal(startTime);
            expect(await nftAuction.startPrice()).to.equal(startPrice);
            expect(await nftAuction.duration()).to.equal(duration);
            expect(await nftAuction.startPriceTokenAddress()).to.equal(startPriceTokenAddress);
        });
        it("工厂合约升级", async function () {
            const NftAuctionFactoryV2 = await ethers.getContractFactory("NftAuctionFactoryV2");
            let nftAuctionFactoryV2 = await NftAuctionFactoryV2.deploy();
            await nftAuctionFactoryV2.waitForDeployment();
            const auctionFactoryV2Addr = await nftAuctionFactoryV2.getAddress();

            const auctionFactoryImplAddr1 = await upgrades.erc1967.getImplementationAddress(auctionFactoryProxyAddr);
            const tx = await nftAuctionFactory.upgradeTo(auctionFactoryV2Addr);
            await tx.wait();
            const auctionFactoryImplAddr2 = await upgrades.erc1967.getImplementationAddress(auctionFactoryProxyAddr);
            nftAuctionFactoryV2 = await NftAuctionFactoryV2.attach(auctionFactoryProxyAddr);
            expect(auctionFactoryImplAddr1).to.not.equal(auctionFactoryImplAddr2);
            expect(typeof nftAuctionFactory.factoryV2 === 'function').to.be.false;
            expect(typeof nftAuctionFactoryV2.factoryV2 === 'function').to.be.true;
            expect(await nftAuctionFactoryV2.factoryV2()).to.equal("factoryV2");
        });
    });

    describe("拍卖合约", function () {
        let nftAuctionContract,auctionAddress;
        let duration;
        beforeEach(async function () {
            const block = await ethers.provider.getBlock("latest");
            const startTime = block.timestamp + 5;
            duration = 100;
            const startPrice = ethers.parseUnits("1", 18);
            const startPriceTokenAddress = ethers.ZeroAddress;
            const tokenId = 1;
            //创建拍卖
            let tx = await nftAuctionFactory.connect(seller).createAuction(
                startTime,
                duration,
                startPrice,
                startPriceTokenAddress,
                myNFTContract.getAddress(),
                tokenId
            );
            await tx.wait();
            nftAuctionContract = NftAuction.attach(await nftAuctionFactory.getAuction(tokenId));
            auctionAddress = await nftAuctionContract.getAddress();
        });
        it("设置eth/usd、usdc/uds价格", async function () {
            await expect(nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress()))
                .to.emit(nftAuctionContract, "PriceFeedSet").withArgs(ethTokenAddress, await eth2UsdContract.getAddress());
            await expect(nftAuctionContract.connect(seller).setPriceFeed(myTokenAddress, await usdc2UsdContract.getAddress()))
                .to.emit(nftAuctionContract, "PriceFeedSet").withArgs(myTokenAddress, await usdc2UsdContract.getAddress());
        });
        it("校验eth/usd、usdc/uds价格", async function () {
            let tx = await nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress());
            await tx.wait();
            tx = await nftAuctionContract.connect(seller).setPriceFeed(myTokenAddress, await usdc2UsdContract.getAddress());
            await tx.wait();
            expect(await nftAuctionContract.getChainlinkDataFeedLatestAnswer(ethTokenAddress)).to.equal(ethInitAnswer);
            expect(await nftAuctionContract.getChainlinkDataFeedLatestAnswer(myTokenAddress)).to.equal(usdcInitAnswer);
        });
        it("只有管理员可以设置价格源", async function () {
            await expect(nftAuctionContract.connect(user1).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress())).to.be.revertedWith("Only seller can set price feed");
        });
        it("不能设置零地址作为代币地址", async function () {
            await expect(nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, ethers.ZeroAddress)).to.be.revertedWith("Invalid price feed address");
        });

        it("拍卖合约升级",async function(){
            const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");
            const nftAuctionV2 = await NftAuctionV2.deploy();
            await nftAuctionV2.waitForDeployment();
            const nftAuctionV2Addr = await nftAuctionV2.getAddress();

            const auctionBeaconAddr = await nftAuctionFactory.auctionBeacon();
            const auctionBeacon = await ethers.getContractAt("NftAuctionBeacon",auctionBeaconAddr);
            const oldAuctionImplAddr = await auctionBeacon.implementation();

            expect(typeof nftAuctionContract.upgradeTest === 'function').to.be.false;

            let tx = await auctionBeacon.upgradeTo(nftAuctionV2Addr);
            await tx.wait();
            const auctionV2 =await NftAuctionV2.attach(auctionAddress);
            const newAuctionImplAddr = await auctionBeacon.implementation();
            expect(oldAuctionImplAddr).to.not.eq(newAuctionImplAddr);
            expect(typeof auctionV2.upgradeTest === 'function').to.be.true;
            expect(await auctionV2.upgradeTest()).to.eq("upgradeTest");
            expect(await nftAuctionContract.startTime()).to.eq(await auctionV2.startTime());
            expect(await nftAuctionContract.nftContractAddress()).to.eq(await auctionV2.nftContractAddress());
        });
        describe("拍卖", function () {
            beforeEach(async function () {
                let tx = await nftAuctionContract.connect(seller).setPriceFeed(ethTokenAddress, await eth2UsdContract.getAddress());
                await tx.wait();
                tx = await nftAuctionContract.connect(seller).setPriceFeed(myTokenAddress, await usdc2UsdContract.getAddress());
                await tx.wait();
            });

            it("应该允许用户用ETH出价", async function () {
                //user1出价
                const bidAmount = ethers.parseEther("1.2");
                await expect(nftAuctionContract.connect(user1).placeBid(ethTokenAddress, bidAmount, { value: bidAmount }))
                    .to.emit(nftAuctionContract, "BidPlaced").withArgs(user1.address, bidAmount, ethTokenAddress);
                expect(await nftAuctionContract.highestBidder()).to.equal(user1.address);
                expect(await nftAuctionContract.highestBid()).to.equal(bidAmount);

                //增加时间到结束拍卖
                const beforeBalance = await ethers.provider.getBalance(seller.address);
                await ethers.provider.send("evm_increaseTime", [duration + 10]);

                //结束拍卖，把NFT转给竞拍出价最高者，把加密币转给卖方
                await expect(nftAuctionContract.endAuction()).to.emit(nftAuctionContract, "AuctionEnded").withArgs(user1.address, bidAmount, ethTokenAddress);
                expect(await myNFTContract.ownerOf(tokenId)).to.equal(user1.address);
                expect(await myNFTContract.balanceOf(user1.address)).to.equal(1);
                expect(await myNFTContract.balanceOf(seller.address)).to.equal(0);
                const afterBalance = await ethers.provider.getBalance(seller.address);
                expect(afterBalance).to.be.equals(beforeBalance + bidAmount);
                expect(await nftAuctionContract.ended()).to.be.true;
            });

            it("应该允许用户用代币出价", async function () {
                //给测试账户转一些测试代币,并授权转账
                const initAmount = ethers.parseUnits("5000", await myTokenContract.decimals());
                await myTokenContract.transfer(user1.address, initAmount);
                await myTokenContract.transfer(user2.address, initAmount);
                await myTokenContract.connect(user1).approve(auctionAddress, initAmount);
                await myTokenContract.connect(user2).approve(auctionAddress, initAmount);

                const bidAmount1 = ethers.parseUnits("3000", await myTokenContract.decimals());
                const bidAmount2 = ethers.parseUnits("4000", await myTokenContract.decimals());

                //user1出价
                await expect(nftAuctionContract.connect(user1).placeBid(myTokenAddress, bidAmount1))
                    .to.emit(nftAuctionContract, "BidPlaced").withArgs(user1.address, bidAmount1, myTokenAddress);
                expect(await myTokenContract.balanceOf(user1.address)).to.equal(initAmount - bidAmount1);
                expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(bidAmount1);
                //user2出价
                await expect(nftAuctionContract.connect(user2).placeBid(myTokenAddress, bidAmount2))
                    .to.emit(nftAuctionContract, "BidPlaced").withArgs(user2.address, bidAmount2, myTokenAddress);
                expect(await myTokenContract.balanceOf(user1.address)).to.equal(initAmount);
                expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount - bidAmount2);
                expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(bidAmount2);
                expect(await nftAuctionContract.highestBid()).to.equal(bidAmount2);
                expect(await nftAuctionContract.highestBidder()).equals(user2.address);
                //增加时间结束拍卖
                await ethers.provider.send("evm_increaseTime", [duration + 1]);
                await expect(nftAuctionContract.endAuction()).to.emit(nftAuctionContract, "AuctionEnded").withArgs(user2.address, bidAmount2, myTokenAddress);
                expect(await myTokenContract.balanceOf(user1.address)).to.equal(initAmount);
                expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount - bidAmount2);
                expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(0);
                expect(await myTokenContract.balanceOf(seller.address)).to.equal(bidAmount2);

                expect(await myNFTContract.balanceOf(user2.address)).to.equal(1);
                expect(await myNFTContract.balanceOf(seller.address)).to.equal(0);
            });

            it("eth与代币交叉出价", async function () {
                //user1使用eth出价，user2使用代币出价
                const initAmount = ethers.parseUnits("5000", await myTokenContract.decimals());
                await myTokenContract.transfer(user2.address, initAmount);
                await myTokenContract.connect(user2).approve(auctionAddress, initAmount);

                const bidAmount = ethers.parseEther("1.2");
                const bidAmount2 = ethers.parseUnits("3500", await myTokenContract.decimals());
                //user1出价
                const beforeBalance = await ethers.provider.getBalance(auctionAddress);
                await expect(nftAuctionContract.connect(user1).placeBid(ethTokenAddress, bidAmount, { value: bidAmount }))
                    .to.emit(nftAuctionContract, "BidPlaced").withArgs(user1.address, bidAmount, ethTokenAddress);
                const afterBalance = await ethers.provider.getBalance(auctionAddress);
                expect(afterBalance).to.be.equals(beforeBalance + bidAmount);
                expect(await nftAuctionContract.highestBidder()).to.equal(user1.address);
                expect(await nftAuctionContract.highestBid()).to.equal(bidAmount);

                //user2出价
                await expect(nftAuctionContract.connect(user2).placeBid(myTokenAddress, bidAmount2))
                    .to.emit(nftAuctionContract, "BidPlaced").withArgs(user2.address, bidAmount2, myTokenAddress);
                expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount - bidAmount2);
                expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(bidAmount2);
                expect(await nftAuctionContract.highestBid()).to.equal(bidAmount2);
                expect(await nftAuctionContract.highestBidder()).equals(user2.address);

                //增加时间结束拍卖
                await ethers.provider.send("evm_increaseTime", [duration + 1]);
                await expect(nftAuctionContract.endAuction()).to.emit(nftAuctionContract, "AuctionEnded").withArgs(user2.address, bidAmount2, myTokenAddress);
                expect(await myTokenContract.balanceOf(user2.address)).to.equal(initAmount - bidAmount2);
                expect(await myTokenContract.balanceOf(auctionAddress)).to.equal(0);
                expect(await myTokenContract.balanceOf(seller.address)).to.equal(bidAmount2);
                expect(await myNFTContract.balanceOf(user2.address)).to.equal(1);
                expect(await myNFTContract.balanceOf(seller.address)).to.equal(0);
            });
            it("拍卖结束不能出价",async function(){
                await ethers.provider.send("evm_increaseTime",[duration + 10]);
                const bidAmount = ethers.parseEther("1.2");
                await expect(nftAuctionContract.connect(user1).placeBid(ethTokenAddress, bidAmount, { value: bidAmount }))
                    .to.be.revertedWith("Auction has ended");
            });
            it("出价异常判断",async function(){
                let bidAmount = ethers.parseEther("0.8");
                await expect(nftAuctionContract.connect(user1).placeBid(ethTokenAddress, bidAmount, { value: bidAmount }))
                    .to.be.revertedWith("Bid must be higher than current highest bid and start price");
                bidAmount = ethers.parseEther("1.3");
                let tx = await nftAuctionContract.connect(user1).placeBid(ethTokenAddress, bidAmount, { value: bidAmount });
                await tx.wait();
                bidAmount = ethers.parseEther("1.1");
                await expect(nftAuctionContract.connect(user2).placeBid(ethTokenAddress, bidAmount, { value: bidAmount }))
                    .to.be.revertedWith("Bid must be higher than current highest bid and start price");
            });
        });
    });
});
