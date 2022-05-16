// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

contract TestChainId {
    function getChainID() public pure returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }
}
