const {ethers} = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy,save } = deployments;
    const { deployer } = await getNamedAccounts();

    const storePath = path.resolve(__dirname, "./.cache/MetaNodeToken.json");

    const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
    const metaNodeToken = await MetaNodeToken.deploy();
    await metaNodeToken.waitForDeployment();
    const metaNodeTokenAddress = await metaNodeToken.getAddress();


    fs.writeFileSync(storePath, JSON.stringify({
        metaNodeTokenAddress,
        abi: MetaNodeToken.interface.format("json")
    }));

    await save("MetaNodeToken",{
        address:metaNodeTokenAddress,
        abi:MetaNodeToken.interface.format("json")
    });
};

module.exports.tags = ['all','deployMetaNodeToken'];