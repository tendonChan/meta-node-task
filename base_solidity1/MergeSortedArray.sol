// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
contract MergeSortedArray{
    function merge(int256[] memory a, int256[] memory b) public pure returns(int256[] memory){
        int256[] memory result = new int256[] (a.length+b.length);
        uint m = 0; 
        uint i=0; 
        uint j= 0;  
        while(i< a.length && j < b.length) {
            if (a[i] <= b[j]) {
                result[m++] = a[i];
                i += 1;
            } else{
            result[m++] = b[j];
                j +=  1;
            }
        }
        while (i<a.length){
            result[m++]= a[i];
            i += 1;
        }
        while (j < b.length ){
            result[m++] =b[j];
            j +=  1;
            
        }
        return result;
    }
}