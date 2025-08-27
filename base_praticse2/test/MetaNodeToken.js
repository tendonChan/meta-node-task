const {ethers,deployments} = require("hardhat");
const { expect } = require("chai");

describe("MetaNodeToken", function () {
    it("Should be able to deploy",async function(){
        await deployments.fixture("deployMetaNodeToken");
        const accts  = await ethers.getSigners();
        [deployer,user1] = accts;

        const deployMetaNodeToken =await deployments.get("MetaNodeToken");
        const metaNodeTokenAddress = deployMetaNodeToken.address;

        const metaNodeToken = await ethers.getContractAt("MetaNodeToken",metaNodeTokenAddress);
        console.log("MetaNodeTokenAddress:",metaNodeTokenAddress);
        console.log("MetaNodeToken:",await metaNodeToken.name(),await metaNodeToken.symbol(),await metaNodeToken.totalSupply());
    });
});