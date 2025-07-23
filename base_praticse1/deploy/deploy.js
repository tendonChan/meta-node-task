const {ethers} = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { save } = deployments;
    [deployer, user1] = await ethers.getSigners();
    const MemeToken = await ethers.getContractFactory("MemeToken");
    const initialSupply = ethers.parseUnits("100",18);
    const routerAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
    memeToken = await MemeToken.deploy("MemeToken", "MEME", initialSupply, routerAddress, deployer.address);
    await memeToken.waitForDeployment();
    const memeTokenAddress = await memeToken.getAddress();

    let transferAmount = ethers.parseUnits("10",8);
    await memeToken.connect(deployer).transfer(user1.address, transferAmount);

    const storePath = path.resolve(__dirname, "./.cache/MemeToken.json");

    fs.writeFileSync(storePath, JSON.stringify({
        memeTokenAddress,
        abi: MemeToken.interface.format("json")
    }));

    await save("MemeToken",{
        address:memeTokenAddress,
        abi:MemeToken.interface.format("json")
    });
};
module.exports.tags = ['deployMemeToken'];