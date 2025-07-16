const { deployments, upgrades, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { save } = deployments;
  // const {deployer} = await getNamedAccounts();
  [deployer, seller] = await ethers.getSigners();

  // 部署myToken代币合约
  const MyToken = await ethers.getContractFactory("MtkToken");
  const myTokenContract = await MyToken.deploy("MtkToken123");
  await myTokenContract.waitForDeployment();

};
module.exports.tags = ['deployMtk'];