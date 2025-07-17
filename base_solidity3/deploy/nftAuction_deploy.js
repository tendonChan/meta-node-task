const { deployments, upgrades, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { save } = deployments;
  // const {deployer} = await getNamedAccounts();
  [deployer, seller] = await ethers.getSigners();

  //部署预言机模拟合约
  // const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
  // const eth2UsdContract = await MockAggregatorV3.deploy(ethInitAnswer, 8);
  // await eth2UsdContract.waitForDeployment();
  // const usdc2UsdContract = await MockAggregatorV3.deploy(usdcInitAnswer, 8);
  // await usdc2UsdContract.waitForDeployment();
 
  
  // 部署NFT合约
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFTContract = await MyNFT.deploy("MyNFT", "MNFT");
  await myNFTContract.waitForDeployment();
  await myNFTContract.connect(deployer).mint(seller.address, 1);
  // 部署myToken代币合约
  const MyToken = await ethers.getContractFactory("MyToken");
  const myTokenContract = await MyToken.deploy("myToken", "MTK", ethers.parseUnits("10000", 18));
  await myTokenContract.waitForDeployment();
  const myTokenAddress = await myTokenContract.getAddress();
  //部署NftAuctionBeacon合约(合约升级使用需要)
  const NftAuction = await ethers.getContractFactory("NftAuction");
  const nftAuction = await NftAuction.deploy();
  await nftAuction.waitForDeployment();
  const nftAuctionAddr = await nftAuction.getAddress();
  const AuctionBeacon = await ethers.getContractFactory("NftAuctionBeacon");
  const auctionBeacon = await AuctionBeacon.deploy(nftAuctionAddr);
  await auctionBeacon.waitForDeployment();
  const auctionBeaconAddr = await auctionBeacon.getAddress();
  // 部署工厂合约(通过代理合约部署)
  const NftAuctionFactory = await ethers.getContractFactory("NftAuctionFactory");
  const auctionFactoryProxy = await upgrades.deployProxy(NftAuctionFactory, [auctionBeaconAddr], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await auctionFactoryProxy.waitForDeployment();
  const proxyAddress = await auctionFactoryProxy.getAddress();
  const nftAuctionFactory = await NftAuctionFactory.attach(proxyAddress);

  // myNFTContract.connect(seller).setApprovalForAll(await nftAuctionFactory.getAddress(), true);
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const storePath = path.resolve(__dirname, "./.cache/NftAuction.json");

  fs.writeFileSync(storePath, JSON.stringify({
    proxyAddress,
    implementationAddress,
    myTokenAddress,
    nftAddress:await myNFTContract.getAddress(),
    abi: NftAuctionFactory.interface.format("json")
  }));

  await save("NftAuction", {
    abi: NftAuctionFactory.interface.format("json"),
    address: proxyAddress,
  });

  await save("MyToken",{
    address:myTokenAddress,
    abi:MyToken.interface.format("json")
  });

  await save("MyNFT",{
    address:await myNFTContract.getAddress(),
    abi:MyNFT.interface.format("json")
  });
};
module.exports.tags = ['deployNftAuction'];