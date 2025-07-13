const {ethers, upgrades} = require("hardhat");
const fs = require('fs');
const path = require("path");
module.exports = async ({getNamedAccounts, deployments}) => {
    const {save} = deployments;
    const {deployer} = await getNamedAccounts();
    console.log("部署用户地址V2：", deployer);

    //读取.cache/proxyNftAuction.json文件
    const storePath = path.resolve(__dirname, "./.cache/proxyNftAuctionFactory.json");
    const data = fs.readFileSync(storePath, 'utf8');
    const {proxyAddress,implAddress,abi}= JSON.parse(data);
    
    const NftAuctionFactoryV2 = await ethers.getContractFactory("NftAuctionFactoryV2");
    //通过代理合约升级
    const nftAuctionFactoryProxyV2 = await upgrades.upgradeProxy(proxyAddress, NftAuctionFactoryV2);
    await nftAuctionFactoryProxyV2.waitForDeployment();
    const proxyAddressV2 = await nftAuctionFactoryProxyV2.getAddress();

    await save("NftAuctionProxyV2", {
        abi,
        address: proxyAddressV2,
    });
}

module.exports.tags = ['upgradeNftAuctionFactory'];