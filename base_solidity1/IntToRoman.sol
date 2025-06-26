// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
contract IntToRoman{

    function ToRoman(uint number) public pure returns (string memory){
        require(number > 0 && number < 4000, "Number must be 1-3999");
        uint[13] memory intNumArray = [uint(1000),900,500,400,100,90,50,40,10,9,5,4,1];
        string[13] memory romanNumArray = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];

        string memory result;
        for(uint i=0;i<intNumArray.length;i++){
            while(number >=intNumArray[i]){
                result = string(abi.encodePacked(result,romanNumArray[i]));
                number -= intNumArray[i];
            }
        }
        return result;
    }
}