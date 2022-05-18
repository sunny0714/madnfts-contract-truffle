// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../../erc-721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../royalties/Royalties.sol";
import "../../royalties/LibRoyalties.sol";

contract TestERC721WithRoyalties is Initializable, Royalties, ERC721Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyalties._INTERFACE_ID_ROYALTIES);
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }
}
