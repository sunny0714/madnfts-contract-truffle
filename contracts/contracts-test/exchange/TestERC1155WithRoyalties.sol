// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../../erc-1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../royalties/Royalties.sol";
import "../../royalties/LibRoyalties.sol";

contract TestERC1155WithRoyalties is Initializable, Royalties, ERC1155Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyalties._INTERFACE_ID_ROYALTIES);
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees, uint amount) external {
        _mint(to, tokenId, amount, "");
        _saveRoyalties(tokenId, _fees);
    }
}
