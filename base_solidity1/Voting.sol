// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
contract Voting {
    mapping (address user => uint256 voteCount) public voteMap;
    address[]  public  candidates;

    function vote(address user) public{
        if(voteMap[user] == 0){
            candidates.push(user);
        }
        voteMap[user]++;
    }

    function getVotes(address user) public view returns (uint256) {
        return voteMap[user];
    }

    function resetVotes() public {
        for(uint256 i=0;i<candidates.length;i++){
            delete voteMap[candidates[i]];
        }
    
        while(candidates.length>0){
            candidates.pop();
        }
    }
}