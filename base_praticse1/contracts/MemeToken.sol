// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

contract MemeToken is ERC20, Ownable {
    struct PersonalInfo {
        uint256 lastTransactionTime;
        uint256 transactionCount;
    }

    event addLiquidityEvent(
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 liquidity
    );

    event removeLiquidityEvent(
        uint256 tokenAmount,
        uint256 ethAmount
    );

    event swapExactTokensForETHEvent(
        uint256 tokenAmount,
        uint256 ethAmount
    );

    uint256 private taxRate = 2; // 2% tax on transfers
    address private taxWallet; // Wallet to receive tax
    uint256 private perDealMaxAmount = 20000000000000000000; // Maximum amount per transaction
    uint256 private timesPerDay = 3; // Maximum number of transactions per day
    uint256 liquidity;
    mapping(address => PersonalInfo) private personalInfo; // Track user transaction info
    uint256 private constant DAY_IN_SECONDS = 24 * 60 * 60; // 24 hours in seconds
    mapping(address => bool) private excludedFromTax;
    mapping(address => bool) private excludedPerDayLimit;
    IUniswapV2Router02 private immutable uniswapRouter;
    address private immutable uniswapPair;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _router,
        address _taxWallet
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_taxWallet != address(0), "Tax wallet cannot be zero address");
        _mint(msg.sender, _initialSupply);
        //初始化 Uniswap Router
        uniswapRouter = IUniswapV2Router02(_router);
        //创建代币/ETH交易对
        uniswapPair = IUniswapV2Factory(uniswapRouter.factory()).createPair(
            address(this),
            uniswapRouter.WETH()
        );
        
        taxWallet = _taxWallet;

        excludedFromTax[msg.sender] = true; // Exclude deployer from tax
        excludedFromTax[taxWallet] = true; // Exclude tax wallet from tax
        excludedFromTax[address(this)] = true; // Exclude contract itself from tax
        excludedFromTax[uniswapPair] = true; // Exclude Uniswap pair from tax
        excludedFromTax[_router] = true; // Exclude Uniswap router from tax

        excludedPerDayLimit[msg.sender] = true; // Exclude deployer from daily limit
        excludedPerDayLimit[taxWallet] = true; // Exclude tax wallet from daily limit
        excludedPerDayLimit[address(this)] = true; // Exclude contract itself from daily limit
        excludedPerDayLimit[uniswapPair] = true; // Exclude Uniswap pair from daily limit
        excludedPerDayLimit[_router] = true; // Exclude Uniswap router from daily limit
    }

    //handle transfer logic, including tax calculation and personal transaction limits
    function _handleTransfer(
        address from,
        address to,
        uint256 amount
    ) internal returns(uint256 taxAmount, uint256 amountAfterTax) {
        
        if(!excludedPerDayLimit[from]){
            require(amount > 0 && amount <= perDealMaxAmount,"Transfer amount exceeds the maximum limit");
            _updatePersonalTransactionInfo(from);
        }
        amountAfterTax = amount;
        if (!excludedFromTax[from]) {
            (taxAmount, amountAfterTax) = calculateTax(amount);
            super._transfer(from, taxWallet, taxAmount); // Transfer tax to tax wallet
        }
        super._transfer(from, to, amountAfterTax); // Transfer remaining amount to `to`
    }

    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        address owner = _msgSender();
        _handleTransfer(owner, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _handleTransfer(from, to, value);
        return true;
    }

    // This function is called internally to update the transaction count and last transaction time
    // for a user. It checks if the user has exceeded the maximum number of transactions allowed
    function _updatePersonalTransactionInfo(address account) private {
        PersonalInfo storage info = personalInfo[account];
        uint256 currentTime = block.timestamp;

        uint256 nextDayStartTime = info.lastTransactionTime + DAY_IN_SECONDS;
        require(
            nextDayStartTime < currentTime ||
                (nextDayStartTime >= currentTime &&
                    info.transactionCount < timesPerDay),
            "Exceeded maximum transactions per day"
        );

        // Reset transaction count if a day has passed
        if (nextDayStartTime < currentTime) {
            info.transactionCount = 0;
            info.lastTransactionTime = currentTime;
        }

        // Increment transaction count
        info.transactionCount++;
    }

    //Adds liquidity to an ERC-20⇄WETH pool with ETH
    function addLiquidity(uint256 tokenAmount) external payable onlyOwner {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        _approve(address(this), address(uniswapRouter), tokenAmount);
        uint256 ethAmount = msg.value;
        require(ethAmount > 0, "ETH amount must be greater than 0");
        assert(super.transfer(address(this), tokenAmount));
        (
            uint256 amountToken,
            uint256 amountETH,
            uint256 _liquidity
        ) = uniswapRouter.addLiquidityETH{value: ethAmount}(
                address(this),
                tokenAmount,
                0,
                0,
                address(this),
                block.timestamp
            );
        liquidity = _liquidity;

        emit addLiquidityEvent(amountToken, amountETH, _liquidity);
    }

    function swapExactTokensForETH(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        (, uint256 amountAfterTax) = _handleTransfer(_msgSender(), address(this), tokenAmount);
        _approve(address(this), address(uniswapRouter), amountAfterTax);
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapRouter.WETH();
        uint[] memory amounts = uniswapRouter.swapExactTokensForETH(
            amountAfterTax,
            0,
            path,
            msg.sender,
            block.timestamp
        );
        emit swapExactTokensForETHEvent(amounts[0], amounts[1]);
    }

    //Removes liquidity from an ERC-20⇄WETH pool and receive ETH.
    function removeLiquidity()
        external
        onlyOwner
        returns (uint256 amountToken, uint256 amountETH)
    {
        IUniswapV2Pair(uniswapPair).approve(address(uniswapRouter),liquidity);
        (amountToken, amountETH) = uniswapRouter.removeLiquidityETH(
            address(this),
            liquidity,
            0,
            0,
            owner(),
            block.timestamp
        );

        emit removeLiquidityEvent(
            amountToken,
            amountETH
        );
    }

    function calculateTax(
        uint256 amount
    ) public view returns (uint256, uint256) {
        uint256 taxAmount = (amount * taxRate) / 100;
        return (taxAmount, amount - taxAmount);
    }

    function setTaxRate(uint256 _taxRate) external onlyOwner {
        require(_taxRate <= 10, "Tax rate cannot exceed 10%");
        taxRate = _taxRate;
    }

    function getTaxRate() external view returns (uint256) {
        return taxRate;
    }

    function setPerDealMaxAmount(uint256 _amount) external onlyOwner {
        perDealMaxAmount = _amount;
    }

    function setTimesPerDay(uint256 _times) external onlyOwner {
        timesPerDay = _times;
    }

    function setExcludedFromTax(
        address account,
        bool excluded
    ) external onlyOwner {
        excludedFromTax[account] = excluded;
    }

    function isExcludedFromTax(address account) external view returns (bool) {
        return excludedFromTax[account];
    }

    function getPerDealMaxAmount() external view returns (uint256) {
        return perDealMaxAmount;
    }

    function getTimesPerDay() external view returns (uint256) {
        return timesPerDay;
    }

    function getUniswapPair() external view returns (address) {
        return uniswapPair;
    }
}
