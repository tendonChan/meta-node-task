// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
contract SimpleERC20{
    address private owner;

    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;
    //代币总数
    uint private _totalSupply;

    string private _name;

    string private _symbol;

    event Transfer(address from, address to, uint256 value);

    event Approval(address owner, address spender, uint256 value);

    constructor(string memory name_, string memory symbol_) {
        owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
    }

    modifier onlyOwner{
        require (msg.sender== owner, "Only owner can perform this action.");
        _;
    }

    function name() public view returns (string memory){
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function TotalSupply() public view returns (uint256)  {
        return _totalSupply;
    }

    function blanceOf(address account) public view returns (uint256){
        return _balances[account];
    }
    //转账
    function transfer(address to,uint256 amount) public returns(bool){
        _transfer(msg.sender, to, amount);
        return true;
    }
    //代扣转账授权
    function approve(address spender,uint256 value) public returns(bool){
        require(spender != address(0), "Address of `spender` cannot be 0");
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    //代扣转账
    function transferFrom(address from,address to,uint256 value) public returns (bool){
        require(from != address(0), "Address of `from` cannot be 0");
        require(to != address(0), "Address of `to` cannot be 0");
        address spender = msg.sender;
        uint256 currentAllowance = _allowances[from][spender];
        require(currentAllowance >= value,"currentAllowance must be greater than the value");
        _allowances[from][spender] = currentAllowance - value;

        _transfer(from, to, value);
        return true;
    }

    //合约所有者增发代币
    function mint(address account,uint256 amount) public onlyOwner {
        _update(address(0),account,amount);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "Address of `from` cannot be 0");
        require(to != address(0), "Address of `to` cannot be 0");
        _update(from, to, value);
    }

    function _update(address from,address to,uint value) internal  {
        if(from != address(0)){
            uint fromBalance = _balances[from];
            if(fromBalance < value){
                revert("fromBalance must be greater than the value");
            }
            _balances[from] = fromBalance - value;
        }else{
            _totalSupply = value;
        }
        if(to != address(0)){
            _balances[to] += value;
        }

        emit Transfer(from, to, value);
    }
}