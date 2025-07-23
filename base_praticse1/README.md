# 操作说明
本指南帮助你在本地与测试网快速使用 MemeToken 合约，包括环境准备、编译测试、部署。

## 1. 环境准备
- Node.js 与 npm（已在 WSL2 下验证）
- 在项目根目录放置 .env（注意：当前 hardhat.config.js 从 ../.env 读取）
- 需要的密钥与 RPC：
  - INFURA_API_KEY
  - PK,PK2,PK3（部署账户的私钥，及其他测试的钱包账户）

## 2. 安装与编译
在子项目目录运行：

- 安装依赖：
  npm install

- 编译合约：
  npm run compile

- 运行测试：
  npm test

- 测试覆盖率（可选）：
  npm run test:coverage

## 3. 部署
- 本地网络（Hardhat 内置网络）：
  npm run deploy
  输出会打印合约地址。

- 测试网（如 Sepolia）：
  先在根目录 .env 配置 INFURA_API_KEY、PK,PK2,PK3，然后：
  npx hardhat deploy --tags deployMemeToken --network sepolia

- 验证合约（可选）：
  npx hardhat verify --network sepolia <合约地址> "MemeToken" "MEME" <INITIAL_SUPPLY> <ROUTER_ADDRESS> <UNISWAP_V2_ROUTER> <MKT_WALLET>
