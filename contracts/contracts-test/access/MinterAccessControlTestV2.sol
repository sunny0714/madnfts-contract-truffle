// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../../contracts/WhitelistControl.sol";

contract WhitelistControlTestV2 is WhitelistControl {
    bytes4 constant public V2 = bytes4(keccak256("V2"));

    function initialize() external initializer {
        __Ownable_init_unchained();
        __WhitelistControl_init_unchained();
    }

    function version() public pure returns (bytes4) {
        return V2;
    }

    uint256[50] private __gap;
}
