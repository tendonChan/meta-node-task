const {ethers,deployments, upgrades} = require("hardhat");
const { expect } = require("chai");

describe("MetaNodeStake", function () {
    let deployer, user1, metaNodeStake,metaNodeStakeAddress, myToken,myTokenAddress,metaNodeToken,metaNodeTokenAddress;
    const ethPid =0,tokenPid = 1;
    this.beforeEach(async function(){
        await deployments.fixture("all");

        const accts  = await ethers.getSigners();
        [deployer,user1] = accts;

        const metaNodeStakeInfo = await deployments.get("MetaNodeStake");
        const myTokenInfo = await deployments.get("MyToken");
        const metaNodeTokenInfo = await deployments.get("MetaNodeToken");
        myTokenAddress = myTokenInfo.address;
        metaNodeStakeAddress = metaNodeStakeInfo.address;
        metaNodeTokenAddress = metaNodeTokenInfo.address;
        

        metaNodeStake = await ethers.getContractAt("MetaNodeStake",metaNodeStakeAddress);
        myToken = await ethers.getContractAt("MyToken",myTokenAddress);
        metaNodeToken = await ethers.getContractAt("MetaNodeToken",metaNodeTokenAddress);

        metaNodeToken.connect(deployer).transfer(metaNodeStakeAddress,ethers.parseEther("1000"));
        myToken.connect(deployer).transfer(user1.address,ethers.parseUnits("1000",18));
    });

    
     it("should add pool",async function(){
        let tx = await metaNodeStake.addPool(ethers.ZeroAddress, 100,ethers.parseEther("0.5"),20,true);
        tx = await metaNodeStake.addPool(myTokenAddress, 100,ethers.parseEther("1"),20,true);

        expect(await metaNodeStake.poolLength()).to.equal(2);
        const ethPool = await metaNodeStake.pool(0);
        const stPool = await metaNodeStake.pool(1);
        expect(ethPool.stTokenAddress).to.equal(ethers.ZeroAddress);
        expect(stPool.stTokenAddress).to.equal(myTokenAddress);
        expect(stPool.poolWeight).to.equal(100);
        expect(stPool.minDepositAmount).to.equal(ethers.parseEther("1"));
        expect(stPool.unstakeLockedBlocks).to.equal(20);
    });

    it("should admin adds pool",async function(){
        let tx = metaNodeStake.connect(user1).addPool(ethers.ZeroAddress, 100,ethers.parseEther("0.5"),20,true);
        await expect(tx).to.be.revertedWithCustomError(metaNodeStake,"AccessControlUnauthorizedAccount")
        .withArgs(user1.address,"0x589d473ba17c0f47d494622893831497bad25919b9afb8e33e9521b8963fccde");
    });

    describe("after add pool",function(){
        let ethPoolWeight = 100, stPoolWeight = 100;
        this.beforeEach(async function(){
            await metaNodeStake.addPool(ethers.ZeroAddress, ethPoolWeight,ethers.parseEther("0.5"),20,true);
            await metaNodeStake.addPool(myTokenAddress, stPoolWeight,ethers.parseEther("1"),20,true);
        });

        it("eth deposit",async function(){
            const ethPid = 0;
            const depositEthAmount = ethers.parseEther("10");
            const tx = await metaNodeStake.connect(user1).depositETH({value:depositEthAmount});
            await tx.wait();
            expect((await metaNodeStake.pool(ethPid)).stTokenAmount).to.equal(depositEthAmount);
            expect(await metaNodeStake.stakingBalance(ethPid,user1.address)).to.equal(depositEthAmount);
        });

        it("myToken deposit",async function(){
            const initialUser1Balance = await myToken.balanceOf(user1.address);
            const depositMyTokenAmount = ethers.parseUnits("100",18);
            let tx = await myToken.connect(deployer).transfer(user1.address,depositMyTokenAmount);
            expect(await myToken.balanceOf(user1.address) - initialUser1Balance).to.equal(depositMyTokenAmount);

            tx = await myToken.connect(user1).approve(metaNodeStakeAddress,depositMyTokenAmount);
            tx = await metaNodeStake.connect(user1).deposit(tokenPid,depositMyTokenAmount);

            expect((await metaNodeStake.pool(tokenPid)).stTokenAmount).to.equal(depositMyTokenAmount);
            expect(await metaNodeStake.stakingBalance(tokenPid,user1.address)).to.equal(depositMyTokenAmount);
        });

        it("generate reward token in pool",async function(){
            const depositEthAmount = ethers.parseEther("10");
            let tx = await metaNodeStake.connect(user1).depositETH({value:depositEthAmount});
            await tx.wait();
            await myToken.connect(user1).approve(metaNodeStakeAddress,ethers.parseUnits("100",18));
            tx = await metaNodeStake.connect(user1).deposit(tokenPid,ethers.parseUnits("100",18));
            await tx.wait();
            const oldEthPool = await metaNodeStake.pool(ethPid);
            const oldTokenPool = await metaNodeStake.pool(tokenPid);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blocksToMine = Number(oldEthPool.lastRewardBlock) - currentBlock + 10;
            for(let i=0;i<blocksToMine;i++){
                await ethers.provider.send("evm_mine");
            }
            await metaNodeStake.updatePool(ethPid);
            await metaNodeStake.updatePool(tokenPid);
            const newEthPool = await metaNodeStake.pool(ethPid);
            const newTokenPool = await metaNodeStake.pool(tokenPid);
            const metaNodePerBlock = await metaNodeStake.MetaNodePerBlock();
            //获取eth池子每质押1个eth累计的奖励代币数
            const accMetaNodePerST_eth = (newEthPool.lastRewardBlock - oldEthPool.lastRewardBlock) * metaNodePerBlock * BigInt(ethPoolWeight) / BigInt(ethPoolWeight + stPoolWeight) * ethers.parseEther("1") / newEthPool.stTokenAmount;
            expect(newEthPool.accMetaNodePerST - oldEthPool.accMetaNodePerST).to.equal(accMetaNodePerST_eth);

            //获取myToken池子每质押1个myToken累计的奖励代币数
            const accMetaNodePerST_token = (newTokenPool.lastRewardBlock - oldTokenPool.lastRewardBlock) * metaNodePerBlock * BigInt(stPoolWeight) / BigInt(ethPoolWeight + stPoolWeight) * ethers.parseEther("1") / newTokenPool.stTokenAmount;
            expect(newTokenPool.accMetaNodePerST - oldTokenPool.accMetaNodePerST).to.equal(accMetaNodePerST_token);
        });
        it("claim reward token",async function(){
            const depositEthAmount = ethers.parseEther("10");
            let tx = await metaNodeStake.connect(user1).depositETH({value:depositEthAmount});
            await tx.wait();
            await myToken.connect(user1).approve(metaNodeStakeAddress,ethers.parseUnits("100",18));
            tx = await metaNodeStake.connect(user1).deposit(tokenPid,ethers.parseUnits("100",18));
            await tx.wait();
            const oldEthPool = await metaNodeStake.pool(ethPid);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blocksToMine = Number(oldEthPool.lastRewardBlock) - currentBlock + 10;
            for(let i=0;i<blocksToMine;i++){
                await ethers.provider.send("evm_mine");
            }
            const oldUser = await metaNodeStake.user(ethPid,user1.address);
            tx = await metaNodeStake.connect(user1).claim(ethPid);
            await tx.wait();
            const newUser = await metaNodeStake.user(ethPid, user1.address);
            const newEthPool = await metaNodeStake.pool(ethPid);
            const numReward = newEthPool.accMetaNodePerST * oldUser.stAmount / ethers.parseEther("1") - oldUser.finishedMetaNode;
            expect(await metaNodeToken.balanceOf(user1.address)).to.equal(numReward);
        });

        it("pause claim reward token",async function(){
            const depositEthAmount = ethers.parseEther("10");
            let tx = await metaNodeStake.connect(user1).depositETH({value:depositEthAmount});
            await tx.wait();
            
            await metaNodeStake.pauseClaim();
            const oldEthPool = await metaNodeStake.pool(ethPid);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blocksToMine = Number(oldEthPool.lastRewardBlock) - currentBlock + 10;
            for(let i=0;i<blocksToMine;i++){
                await ethers.provider.send("evm_mine");
            }
            tx = metaNodeStake.connect(user1).claim(ethPid);
            await expect(tx).to.be.revertedWith("claim is paused");
        });

        it("unstake myToken",async function(){
            await myToken.connect(user1).approve(metaNodeStakeAddress,ethers.parseUnits("100",18));
            let tx = await metaNodeStake.connect(user1).deposit(tokenPid,ethers.parseUnits("100",18));
            await tx.wait();
            const oldTokenPool = await metaNodeStake.pool(tokenPid);
            const oldUser = await metaNodeStake.user(tokenPid,user1.address);
            const currentBlock = await ethers.provider.getBlockNumber();
            const blockToMine  = Number(oldTokenPool.lastRewardBlock) - currentBlock + 30;
            for(let i=0;i<blockToMine;i++){
                await ethers.provider.send("evm_mine");
            }
            const unstakeAmount = ethers.parseUnits("50",18);
            tx = await metaNodeStake.connect(user1).unstake(tokenPid,unstakeAmount);
            await tx.wait();
            const newTokenPool = await metaNodeStake.pool(tokenPid);
            const newUser = await metaNodeStake.user(tokenPid,user1.address);
            expect(newTokenPool.stTokenAmount).to.equal(oldTokenPool.stTokenAmount - unstakeAmount);
            expect(newUser.stAmount).to.equal(oldUser.stAmount - unstakeAmount);
            const pendingMetaNode = newTokenPool.accMetaNodePerST * oldUser.stAmount / ethers.parseEther("1") - oldUser.finishedMetaNode;
            expect(newUser.pendingMetaNode - oldUser.pendingMetaNode).to.equal(pendingMetaNode);
            expect(newUser.finishedMetaNode - oldUser.finishedMetaNode).to.equal(pendingMetaNode);
        });

        it("withdraw myToken",async function(){
            await myToken.connect(user1).approve(metaNodeStakeAddress,ethers.parseUnits("100",18));
            let tx = await metaNodeStake.connect(user1).deposit(tokenPid,ethers.parseUnits("100",18));
            await tx.wait();
            const times = 2;
            const unstakeAmount = ethers.parseUnits("20",18);
            for(let k =0;k<times;k++){
                tx = await metaNodeStake.connect(user1).unstake(tokenPid,unstakeAmount);
                await tx.wait();
            }
            for(let i=0;i<30;i++){
                await ethers.provider.send("evm_mine");
            }
            const userTokenBefore = await myToken.balanceOf(user1.address);
            const stakeTokenBefore = await myToken.balanceOf(metaNodeStakeAddress);
            let [requestAmount, pendingWithdrawAmount] = await metaNodeStake.withdrawAmount(tokenPid, user1.address);
            tx = await metaNodeStake.connect(user1).withdraw(tokenPid);
            await tx.wait();
            const userTokenAfter = await myToken.balanceOf(user1.address);
            const stakeTokenAfter = await myToken.balanceOf(metaNodeStakeAddress);
            expect(userTokenAfter - userTokenBefore).to.equal(unstakeAmount * BigInt(times));
            expect(stakeTokenBefore - stakeTokenAfter).to.equal(unstakeAmount * BigInt(times));

            [requestAmount, pendingWithdrawAmount] = await metaNodeStake.withdrawAmount(tokenPid, user1.address);
            expect(requestAmount).to.equal(0);
            expect(pendingWithdrawAmount).to.equal(0);
        });

        it("pause withdraw",async function(){
            await myToken.connect(user1).approve(metaNodeStakeAddress,ethers.parseUnits("100",18));
            let tx = await metaNodeStake.connect(user1).deposit(tokenPid,ethers.parseUnits("100",18));
            await tx.wait();

            await metaNodeStake.pauseWithdraw();
            tx =  metaNodeStake.connect(user1).unstake(tokenPid,ethers.parseUnits("20",18));
            await expect(tx).to.be.revertedWith("withdraw is paused");

            tx = metaNodeStake.connect(user1).withdraw(tokenPid);
            await expect(tx).to.be.revertedWith("withdraw is paused");
        });
    });
    it("should upgrades",async function(){
        expect(typeof metaNodeStake.getVersion === 'function').to.be.false;
        await deployments.fixture("metaNodeStakeUpgrade");
        const stakeV2Info = await deployments.get("MetaNodeStakeV2");
        const proxyAddress = stakeV2Info.address;
        const stakeV2 = await ethers.getContractAt("MetaNodeStakeV2",proxyAddress);
        expect(typeof stakeV2.getVersion === 'function').to.be.true;
        expect(await stakeV2.getVersion()).to.equal("MetaNodeStakeV2");
        // console.log("implAddress:",await upgrades.erc1967.getImplementationAddress(proxyAddress));
    });
});