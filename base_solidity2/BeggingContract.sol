// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract BeggingContract{
    address owner;
    mapping(address account => uint256 amount) donorMap;

    //设置捐赠开始时间、结果时间及是否启用捐赠时间限制
    uint256 donationStartTime;
    uint256 donationEndTime;
    bool donationTimeEnable;
    
    struct Donor{
        address addr;
        uint256 amount;
    }

    Donor[3] donorTop3;

    event Donation(address account, uint256 amount);

    constructor(){
        owner = msg.sender;
        donationTimeEnable = false;
    }

    modifier onlyOwner{
        require (msg.sender== owner, "Only owner can perform this action.");
        _;
    }

    modifier donationTimeLimit{
        if(donationTimeEnable){
            require((block.timestamp >= donationStartTime && block.timestamp <= donationEndTime),"Cannot donate before or after the donation time");
        }
        _ ;
    }

    function donate() external payable donationTimeLimit{
        require(msg.value > 0, "Donation amount must be greater than 0");
        donorMap[msg.sender] += msg.value;
        _adjustTop3Donor(msg.sender);
        emit Donation(msg.sender, msg.value);
    }

    function getDonation(address addr) public view returns (uint256) {
        require(addr != address(0), "Address cannot be 0");
        return donorMap[addr];
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    //设置捐赠时间
    function setDonationTime(uint256 startTime,uint256 endTime) external  onlyOwner{
        donationStartTime = startTime;
        donationEndTime = endTime;
    }
    //是否限制捐赠时间
    function setDonationTimeEnable(bool enable) external onlyOwner{
        donationTimeEnable = enable;
    }

    //调整捐赠金额最多的前3个捐赠人信息
    function _adjustTop3Donor(address newDonor) private{
        uint256 amount = donorMap[newDonor];
        uint256 length = donorTop3.length;
        bool isInTop3 = false;
        for(uint8 i=0;i<length;i++){
            if(donorTop3[i].addr == newDonor){
                donorTop3[i].amount += amount;
                isInTop3 = true;
                break;
            }
        }
        if(!isInTop3){
            if(donorTop3[length - 1].amount < amount){
                donorTop3[length - 1] = Donor(newDonor, amount);
            }else{
                return;
            }
        }
        _sortTop3();
    }
    //对捐赠金额最多的前 3 个地址排序
    function _sortTop3() private {
        Donor memory temp;
        for(uint8 i=0;i<donorTop3.length;i++){
            for(uint8 j=i+1;j<donorTop3.length;j++){
                if(donorTop3[i].amount < donorTop3[j].amount){
                    temp = donorTop3[j];
                    donorTop3[j] =donorTop3[i];
                    donorTop3[i] = temp;
                }
            }
        }
    }

    //显示捐赠金额最多的前 3 个地址
    function getTop3() public view returns(address[] memory){
        address[] memory top3Address = new address[] (3);
        for(uint8 i=0;i<donorTop3.length;i++) {
           top3Address[i] = donorTop3[i].addr;
        }
        return top3Address;
    }

}