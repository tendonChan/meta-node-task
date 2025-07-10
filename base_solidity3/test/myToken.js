const {ethers} = require("hardhat");
const {expect} = require("chai");

describe("MyToken",function () {
    let myTokenContract;
    let deployer, user1, user2;
    this.beforeEach(async function () {
        [deployer,user1,user2] = await ethers.getSigners();
        const MyToken = await ethers.getContractFactory("MyToken");
        myTokenContract = await MyToken.deploy();
    });

    it("Should have the correct name and symbol", async function () {
        console.log("deploy address:",await myTokenContract.getAddress());
        console.log("deployer address:",deployer.address);
        console.log(await myTokenContract.balanceOf(deployer.address));
        expect(await myTokenContract.name()).to.equal("MyToken");
        expect(await myTokenContract.symbol()).to.equal("MTK");
        expect(await myTokenContract.balanceOf(deployer.address)).to.equal(ethers.parseUnits("100", 18));
    });

    it("Should allow users to transfer tokens", async function () {
        const transferAmount = ethers.parseUnits("10", 18);
        await myTokenContract.connect(deployer).transfer(user1.address, transferAmount);
        expect(await myTokenContract.balanceOf(user1.address)).to.equal(transferAmount);
        expect(await myTokenContract.balanceOf(deployer.address)).to.equal(ethers.parseUnits("90", 18));
    });

    it("Should allow users to approve and transfer tokens on behalf of another user", async function () {
        const approveAmount = ethers.parseUnits("5", 18);
        await myTokenContract.connect(deployer).approve(user1.address, approveAmount);
        expect(await myTokenContract.allowance(deployer.address, user1.address)).to.equal(approveAmount);

        await myTokenContract.connect(user1).transferFrom(deployer.address, user2.address, approveAmount);
        expect(await myTokenContract.balanceOf(user2.address)).to.equal(approveAmount);
        expect(await myTokenContract.balanceOf(deployer.address)).to.equal(ethers.parseUnits("95", 18));
    });
});