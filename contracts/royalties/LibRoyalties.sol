// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

library LibRoyalties {
    /*
     * bytes4(keccak256('getRoyaltyBps(uint256)')) == 0x0ebd4c7f
     * bytes4(keccak256('getRoyaltyRecipients(uint256)')) == 0xb9c4d9fb
     *
     * => 0x0ebd4c7f ^ 0xb9c4d9fb == 0xb7799584
     */
    bytes4 constant _INTERFACE_ID_ROYALTIES = 0xb7799584;
}
