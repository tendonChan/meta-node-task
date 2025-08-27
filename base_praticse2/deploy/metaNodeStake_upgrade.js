const {ethers, upgrades} = require("hardhat");
const fs = require('fs');
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy,save } = deployments;
    const { deployer } = await getNamedAccounts();

        //读取.cache/NftAuction.json文件
    const stakePath = path.resolve(__dirname, "./.cache/MetaNodeStake.json");
    const data = fs.readFileSync(stakePath, 'utf8');
    const {proxyAddress,implAddress,abi}= JSON.parse(data);

    const MetaNodeStakeV2 = await ethers.getContractFactory("MetaNodeStakeV2");
    const metaNodeStakeV2 = await MetaNodeStakeV2.deploy();
    await metaNodeStakeV2.waitForDeployment();
    const metaNodeStakeV2Addr = await metaNodeStakeV2.getAddress();
    const metaNodeStake = await ethers.getContractAt("MetaNodeStake",proxyAddress);
    let tx = await metaNodeStake.upgradeToAndCall(metaNodeStakeV2Addr,'0x');
    await tx.wait();
    // console.log("old implAddress:",implAddress,"newImplAddress:",metaNodeStakeV2Addr);
    fs.writeFileSync(stakePath, JSON.stringify({
        proxyAddress,
        implAddress:metaNodeStakeV2Addr,
        abi:MetaNodeStakeV2.interface.format("json")
    }));

    await save("MetaNodeStakeV2",{
        address:proxyAddress,
        abi:MetaNodeStakeV2.interface.format("json")
    });
};

module.exports.tags = ['metaNodeStakeUpgrade'];