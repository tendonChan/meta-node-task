// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
contract RomanToInt{
    function charToValue(bytes1 char) private pure returns (uint) {
        if (char == 'I') return 1;
        if (char == 'V') return 5;
        if (char == 'X') return 10;
        if (char == 'L') return 50;
        if (char == 'C') return 100;
        if (char == 'D') return 500;
        if (char == 'M') return 1000;
        revert("Invalid Roman numeral");
    }

    function ToInt(string memory romanStr) public pure returns (uint){
       bytes memory romanBytes = bytes(romanStr);
       uint result = 0;
       uint preVal = 0;
       for(uint i=0;i<romanBytes.length;i++){
        uint val = charToValue(romanBytes[i]);
           if (val > preVal && preVal != 0) {
                result += val - preVal - preVal;
           }else {
                result += val;
           }
           preVal = val;
       }
       return result;
    }
}
