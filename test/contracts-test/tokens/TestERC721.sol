// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC721 is ERC721, Ownable {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {

    }

    // function mint(address to, uint tokenId, string memory uri) external {
    //     _mint(to, tokenId);
    //     _setTokenURI(tokenId, uri);
    // }

    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }

    function burn(uint tokenId) external {
        _burn(tokenId);
    }
}
