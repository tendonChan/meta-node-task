const {ethers,upgrades} = require("hardhat");
const fs = require('fs');
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy,save } = deployments;
    const { deployer } = await getNamedAccounts();

     //读取.cache/NftAuction.json文件
    const tokenStorePath = path.resolve(__dirname, "./.cache/MetaNodeToken.json");
    const data = fs.readFileSync(tokenStorePath, 'utf8');
    const {metaNodeTokenAddress,abi}= JSON.parse(data);

    // const metaNodeToken = await ethers.getContractAt("MetaNodeToken",metaNodeTokenAddress);
    const MetaNodeStake = await ethers.getContractFactory("MetaNodeStake");

    const metaNodeStakeProxy = await upgrades.deployProxy(MetaNodeStake,
        [metaNodeTokenAddress,1,1000,ethers.parseEther("0.1")],
        {
        initializer: "initialize",
        kind: "uups"
    });

    await metaNodeStakeProxy.waitForDeployment();
    const proxyAddress = await metaNodeStakeProxy.getAddress();
    const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    const stakeStorePath = path.resolve(__dirname, "./.cache/MetaNodeStake.json");
    fs.writeFileSync(stakeStorePath, JSON.stringify({
        proxyAddress,
        implAddress,
        abi:MetaNodeStake.interface.format("json")
    }));

    await save("MetaNodeStake",{
        address:proxyAddress,
        abi:MetaNodeStake.interface.format("json")
    });
};

module.exports.tags = ['all','deployMetaNodeStake'];