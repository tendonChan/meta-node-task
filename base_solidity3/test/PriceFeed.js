const {ethers} = require("hardhat");
const {expect} = require("chai");
describe("PriceFeed", function () {
    it("Should deploy the PriceFeed contract", async function () {
        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        const priceFeedContract = await PriceFeed.deploy();
        console.log("PriceFeed Contract Address:", await priceFeedContract.getAddress());
        
        await priceFeedContract.setPriceFeed("0x694AA1769357215DE4FAC081bf1f309aDC325306");
        
        console.log("Price Feed Latest Answer:", await priceFeedContract.getChainlinkDataFeedLatestAnswer());
    });
});