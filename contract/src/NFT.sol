// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFT
 * @dev Simple NFT contract for marketplace items
 */
contract NFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("Marketplace NFT", "MNFT") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT
     * @param tokenURI Metadata URI for the NFT
     * @return tokenId of the newly minted NFT
     */
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        return newTokenId;
    }

    /**
     * @dev Get the current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
