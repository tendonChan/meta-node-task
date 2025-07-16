# 实现一个 NFT 拍卖市场

### 任务目标  
1、使用 Hardhat 框架开发一个 NFT 拍卖市场。  
2、使用 Chainlink 的 feedData 预言机功能，计算 ERC20 和以太坊到美元的价格。  
3、使用 UUPS/透明代理模式实现合约升级。  
4、使用类似于 Uniswap V2 的工厂模式管理每场拍卖。  


```shell
# 单元测试
npx hardhat test test/myNFT.js
npx hardhat test test/myToken.js
# 集成测试
npx hardhat test test/NftAuction.js
# 测试部署及合约升级
npx hardhat test test/NftAuction_deploy_upgrade.js

# 部署(sepolia测试网)
npx hardhat deploy --network sepolia --tags deployNftAuction
# 合约升级(sepolia测试网)
npx hardhat deploy --network sepolia --tags upgradeNftAuction


```

### 测试报告
````shell
npx hardhat test

MyNFT
    ✔ Should have the correct name and symbol
    ✔ Should allow users to mint NFTs
    ✔ Should allow users to transfer NFTs
    ✔ Should allow users to safeTransfer NFTs
MyToken
    ✔ Should have the correct name and symbol
    ✔ Should allow users to transfer tokens
    ✔ Should allow users to approve and transfer tokens on behalf of another user
NftAuction
    工厂合约
      ✔ 初始化校验
      ✔ 创建拍卖
      ✔ 工厂合约升级
    拍卖合约
      ✔ 设置eth/usd、usdc/uds价格
      ✔ 校验eth/usd、usdc/uds价格
      ✔ 只有管理员可以设置价格源
      ✔ 不能设置零地址作为代币地址
      ✔ 拍卖合约升级
      拍卖
        ✔ 应该允许用户用ETH出价
        ✔ 应该允许用户用代币出价
        ✔ eth与代币交叉出价
        ✔ 拍卖结束不能出价
        ✔ 出价异常判断
 
````