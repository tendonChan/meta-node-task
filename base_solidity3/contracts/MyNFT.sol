// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    string private _tokenURI;
    
    constructor(string memory name,string memory symbol) ERC721(name,symbol) Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    function setTokenURI(uint256 tokenId,string memory newTokenURI) external onlyOwner {
        _setTokenURI(tokenId,newTokenURI);
    }
}