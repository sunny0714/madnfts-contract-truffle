// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../../../contracts/WhitelistControl.sol";

contract WhitelistControlTestV1 is WhitelistControl {

    function initialize() external initializer {
        __Ownable_init_unchained();
        __WhitelistControl_init_unchained();
    }

    uint256[50] private __gap;
}
