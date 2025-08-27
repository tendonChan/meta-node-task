const {ethers} = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy,save } = deployments;
    const { deployer } = await getNamedAccounts();

    const storePath = path.resolve(__dirname, "./.cache/MyToken.json");

    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy();
    await myToken.waitForDeployment();
    const myTokenAddress = await myToken.getAddress();


    fs.writeFileSync(storePath, JSON.stringify({
        myTokenAddress,
        abi: MyToken.interface.format("json")
    }));

    await save("MyToken",{
        address:myTokenAddress,
        abi:MyToken.interface.format("json")
    });
};

module.exports.tags = ['all','deployMyToken'];