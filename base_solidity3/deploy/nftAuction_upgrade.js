const {ethers, upgrades} = require("hardhat");
const fs = require('fs');
const path = require("path");
module.exports = async ({getNamedAccounts, deployments}) => {
    const {save} = deployments;
    [deployer, seller] = await ethers.getSigners();

    //读取.cache/NftAuction.json文件
    const storePath = path.resolve(__dirname, "./.cache/NftAuction.json");
    const data = fs.readFileSync(storePath, 'utf8');
    const {proxyAddress,implementationAddress,myTokenAddress,nftAddress,abi}= JSON.parse(data);
  
    const MyToken = await ethers.getContractFactory("MyToken");
    const MyNFT = await ethers.getContractFactory("MyNFT");

    const NftAuctionFactoryV2 = await ethers.getContractFactory("NftAuctionFactoryV2");
    const nftAuctionFactoryV2 = await NftAuctionFactoryV2.deploy();
    await nftAuctionFactoryV2.waitForDeployment();
    const nftAuctionFactoryV2Addr = await nftAuctionFactoryV2.getAddress();
    const oldAuctionFactory = await ethers.getContractAt("NftAuctionFactory", proxyAddress);

 
    const NftAuctionFactory = await ethers.getContractFactory("NftAuctionFactory");
    const auctionBeaconAddr = await oldAuctionFactory.auctionBeacon();
    console.log("auctionBeacon:",auctionBeaconAddr);
    let tx= await oldAuctionFactory.upgradeTo(nftAuctionFactoryV2Addr);
    await tx.wait();
    // const auctionFactoryImplAddr = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    const auctionFactoryImplAddr = nftAuctionFactoryV2Addr; 
    
    const auctionBeacon = await ethers.getContractAt("NftAuctionBeacon",auctionBeaconAddr);
    const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");
    const nftAuctionV2 = await NftAuctionV2.deploy();
    await nftAuctionV2.waitForDeployment();
    const nftAuctionV2Addr = await nftAuctionV2.getAddress();
    tx = await auctionBeacon.upgradeTo(nftAuctionV2Addr);
    await tx.wait();

    fs.writeFileSync(storePath, JSON.stringify({
      proxyAddress,
      implementationAddress:auctionFactoryImplAddr,
      myTokenAddress,
      nftAddress:nftAddress,
      abi: NftAuctionFactoryV2.interface.format("json")
    }));

    await save("NftAuction", {
      abi: NftAuctionFactoryV2.interface.format("json"),
      address: proxyAddress,
    });

    await save("MyToken",{
      address:myTokenAddress,
      abi:MyToken.interface.format("json")
    });

    await save("MyNFT",{
      address:nftAddress,
      abi:MyNFT.interface.format("json")
    });
}

module.exports.tags = ['upgradeNftAuction'];