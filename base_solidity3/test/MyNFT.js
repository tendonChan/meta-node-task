const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("MyNFT", function () {
    let deployer, user1, user2, user3;
    let myNFTContract;
    this.beforeEach(async function () {
        [deployer, user1, user2,user3] = await ethers.getSigners();
        const MyNFT = await ethers.getContractFactory("MyNFT");
        myNFTContract = await MyNFT.deploy("MyNFT", "MNFT");
    });

    it("Should have the correct name and symbol", async function () {
        console.log("deploy address:", await myNFTContract.getAddress());
        console.log("deployer address:", deployer.address);
        expect(await myNFTContract.name()).to.equal("MyNFT");
        expect(await myNFTContract.symbol()).to.equal("MNFT");
    });

    it("Should allow users to mint NFTs", async function () {
        const tokenURI = "https://example.com/metadata/";
        const tokenId = 1;
        await myNFTContract.connect(deployer).mint(user1.address, tokenId);
        expect(await myNFTContract.balanceOf(user1.address)).to.equal(1);
        await myNFTContract.connect(deployer).setTokenURI(tokenId, tokenURI + tokenId);
        expect(await myNFTContract.tokenURI(tokenId)).to.equal(tokenURI + tokenId);
    });

    it("Should allow users to transfer NFTs", async function () {
        const tokenURI = "https://example.com/metadata/2";
        const tokenId = 2;
        await myNFTContract.connect(deployer).mint(user1.address, tokenId);
        expect(await myNFTContract.balanceOf(user1.address)).to.equal(1);
        await myNFTContract.connect(user1).approve(user2.address, tokenId);
        expect(await myNFTContract.getApproved(tokenId)).to.equal(user2.address);

        await myNFTContract.connect(user2).transferFrom(user1.address, user3.address, tokenId);
        expect(await myNFTContract.balanceOf(user3.address)).to.equal(1);
        expect(await myNFTContract.balanceOf(user1.address)).to.equal(0);
    });

    it("Should allow users to safeTransfer NFTs", async function () {

        const tokenURI = "https://example.com/metadata/3";
        const tokenId = 3;
        await myNFTContract.connect(deployer).mint(user1.address, tokenId);
        expect(await myNFTContract.balanceOf(user1.address)).to.equal(1);
        
        await myNFTContract.connect(user1).safeTransferFrom(user1.address, user2.address, tokenId);
        expect(await myNFTContract.balanceOf(user2.address)).to.equal(1);
    });
});