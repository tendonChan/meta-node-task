const {deployments,upgrades,ethers} = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({getNamedAccounts, deployments}) => {
  const {save} = deployments;
  const {deployer} = await getNamedAccounts();

  const NftAuction = await ethers.getContractFactory("NftAuction");
  //通过代理合约部署  
  const nftAuctionProxy = await upgrades.deployProxy(NftAuction,[], {
    initializer: 'init'
  });

  await nftAuctionProxy.waitForDeployment();
  const proxyAddress = await nftAuctionProxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("代理合约地址：", proxyAddress);
  console.log("目标合约地址：", implementationAddress);

  const storePath =path.resolve(__dirname, "./.cache/proxyNftAuction.json");

  fs.writeFileSync(storePath, JSON.stringify({
    proxyAddress,
    implementationAddress,
    abi: NftAuction.interface.format("json")
  }));

  await save("NftAuctionProxy", {
    abi: NftAuction.interface.format("json"),
    address: proxyAddress,
  });
};
module.exports.tags = ['deployNftAuction'];