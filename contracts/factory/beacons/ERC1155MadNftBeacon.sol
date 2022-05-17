// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract ERC1155MadNftBeacon is UpgradeableBeacon {
    constructor(address impl) UpgradeableBeacon(impl) {

    }
}
