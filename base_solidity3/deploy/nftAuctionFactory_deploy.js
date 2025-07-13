const {deployments,upgrades,ethers} = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({getNamedAccounts, deployments}) => {
  const {save} = deployments;
  // const {deployer} = await getNamedAccounts();
  [deployer, seller, user1, user2] = await ethers.getSigners();

  const NftAuctionFactory = await ethers.getContractFactory("NftAuctionFactory");
  //通过代理合约部署  
  const nftAuctionFactoryProxy = await upgrades.deployProxy(NftAuctionFactory,[], {
    initializer: 'init'
  });

  await nftAuctionFactoryProxy.waitForDeployment();
  const proxyAddress = await nftAuctionFactoryProxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  const storePath =path.resolve(__dirname, "./.cache/proxyNftAuctionFactory.json");

  fs.writeFileSync(storePath, JSON.stringify({
    proxyAddress,
    implementationAddress,
    abi: NftAuctionFactory.interface.format("json")
  }));

  await save("NftAuctionFactoryProxy", {
    abi: NftAuctionFactory.interface.format("json"),
    address: proxyAddress,
  });
};
module.exports.tags = ['deployNftAuctionFactory'];