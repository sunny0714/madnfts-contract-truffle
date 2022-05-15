// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./lazy-mint/erc-1271/ERC1271Validator.sol";
import "./lazy-mint/erc-721/LibERC721LazyMint.sol";

contract Mint721Validator is ERC1271Validator {
    function __Mint721Validator_init_unchained() internal initializer {
        __EIP712_init_unchained("Mint721", "1");
    }

    function validate(address account, bytes32 hash, bytes memory signature) internal view {
        validate1271(account, hash, signature);
    }
    uint256[50] private __gap;
}
