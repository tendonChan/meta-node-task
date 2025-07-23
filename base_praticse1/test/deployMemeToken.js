const {ethers} = require("hardhat");
const { expect } = require("chai");

const IUniswapV2PairABI = require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
const IWETHABI = require("@uniswap/v2-periphery/build/WETH9.json").abi;

describe("MemeToken", function () {
    let deployer, user1, user2;
    let memeToken;
    let pairAddress,pairContract,wethAddress,wethContract;
    this.beforeEach(async function(){
        [deployer, user1, user2] = await ethers.getSigners();
        const MemeToken = await ethers.getContractFactory("MemeToken");
        const initialSupply = ethers.parseUnits("100",18);
        const routerAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
        memeToken = await MemeToken.deploy("MemeToken", "MEME", initialSupply, routerAddress, deployer.address);
        await memeToken.waitForDeployment();

        let transferAmount = ethers.parseUnits("10",8);
        await memeToken.connect(deployer).transfer(user1.address, transferAmount);

        pairAddress = await memeToken.getUniswapPair();
        pairContract = await ethers.getContractAt(IUniswapV2PairABI, pairAddress);
        wethAddress = await pairContract.token1();
        wethContract = await ethers.getContractAt(IWETHABI, wethAddress);
    });

    it("should deploy the contract with correct initial values", async function () {
        // const memeToken = await ethers.getContract("MemeToken");
        expect(await memeToken.name()).to.equal("MemeToken");
        expect(await memeToken.symbol()).to.equal("MEME");
        expect(await memeToken.totalSupply()).to.equal(ethers.parseUnits("100",18));
        expect(await memeToken.owner()).to.equal(deployer.address);
    });

    it("should transfer tokens correctly", async function () {
        let transferAmount = ethers.parseUnits("5",8);
        const walletBalanceBefore = await memeToken.balanceOf(deployer.address);
        await memeToken.connect(user1).transfer(user2.address, transferAmount);
        const taxRate = await memeToken.getTaxRate();
        // Calculate expected balance using BigInt math
        const taxRateBN = BigInt(taxRate);
        const transferAmountBN = BigInt(transferAmount);
        const hundred = BigInt(100);
        const expectedUser2Balance = transferAmountBN * (hundred - taxRateBN) / hundred;
        expect(await memeToken.balanceOf(user2.address)).to.equal(expectedUser2Balance);
        expect(await memeToken.balanceOf(deployer.address)).to.equal(walletBalanceBefore + transferAmountBN * taxRateBN / hundred);
    });


    it("should allow owner to set tax rate", async function () {
        const newTaxRate = 5; // 5%
        await memeToken.connect(deployer).setTaxRate(newTaxRate);
        expect(await memeToken.getTaxRate()).to.equal(newTaxRate);
    });

    it("Exceeded maximum transactions per day",async function() {
        const transferAmount = ethers.parseUnits("1", 8);
        await memeToken.connect(user1).transfer(user2.address, transferAmount);
        await memeToken.connect(user1).transfer(user2.address, transferAmount);
        await memeToken.connect(user1).transfer(user2.address, transferAmount);
        await expect(memeToken.connect(user1).transfer(user2.address, transferAmount)).to.be.revertedWith("Exceeded maximum transactions per day");
    })

    it("Transfer amount exceeds the maximum limit", async function() {
        const tx = await memeToken.connect(deployer).setPerDealMaxAmount(ethers.parseUnits("100", 8));
        await tx.wait();
        const transferAmount = ethers.parseUnits("100", 8);
        await expect(memeToken.connect(user1).transfer(user2.address, transferAmount)).to.be.revertedWith("Transfer amount exceeds the maximum limit");
    });

    it("should add Liquidity",async function() {
        const tokenAmount = 10000;
        const ethAmount = 1000;
        tx = await memeToken.addLiquidity(tokenAmount,{value: ethAmount});
        const receipt =await tx.wait();
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'addLiquidityEvent');
        expect(event).to.not.be.undefined;
        const memeTokenAmountOfPair = await memeToken.balanceOf(pairAddress);
        expect(memeTokenAmountOfPair).to.equal(tokenAmount);
        expect(ethAmount).to.equal(await wethContract.balanceOf(pairAddress));
        expect(event.args[2]).to.equal(await pairContract.balanceOf(memeTokenAddress));
    })

     it("should swap exactToken for eth",async function(){
        const swapTokenAmount = 100;
        const taxRate = await memeToken.getTaxRate();
        const taxAmount = (BigInt(swapTokenAmount) * BigInt(taxRate)) / BigInt(100);
        const tokenAmountAfterTax = BigInt(swapTokenAmount) - taxAmount;
        const deployerTokensBefore = await memeToken.balanceOf(deployer.address);
        const user1TokenBefore = await memeToken.balanceOf(user1.address);
        const pairTokenBefore = await memeToken.balanceOf(pairAddress);
        console.log("tax:",taxAmount,tokenAmountAfterTax);
        console.log("tokens:", deployerTokensBefore, user1TokenBefore, pairTokenBefore);
        console.log("before swap user1 ETH balance:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
        let tx = await memeToken.connect(user1).swapExactTokensForETH(swapTokenAmount);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'swapExactTokensForETHEvent');
        expect(event).to.not.be.undefined;
        expect(event.args[0]).to.equal(tokenAmountAfterTax);
        expect(user1TokenBefore - await memeToken.balanceOf(user1.address)).to.equal(swapTokenAmount);
        expect(await memeToken.balanceOf(pairAddress)).to.equal(pairTokenBefore + tokenAmountAfterTax);
        expect(await memeToken.balanceOf(deployer.address)).to.equal(deployerTokensBefore + BigInt(taxAmount));
        console.log("args:", event.args[0], event.args[1]);
        console.log("after swap user1 ETH balance:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
    });

    it("should remove liquidity",async function(){
        const deployerTokensBefore = await memeToken.balanceOf(deployer.address);
        const pairTokensBefore = await memeToken.balanceOf(pairAddress);
        const pairEthBefore = await wethContract.balanceOf(pairAddress);
        console.log("memTokens:",deployerTokensBefore,pairTokensBefore,pairEthBefore);
        let tx = await memeToken.connect(deployer).removeLiquidity();
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'removeLiquidityEvent');
        expect(event).to.not.be.undefined;
        console.log("deployer tokens after:", await memeToken.balanceOf(deployer.address));
        expect(event.args[0]).to.equal(await memeToken.balanceOf(deployer.address) - deployerTokensBefore);
        expect(event.args[1]).to.equal(pairEthBefore - await wethContract.balanceOf(pairAddress));
    });
});