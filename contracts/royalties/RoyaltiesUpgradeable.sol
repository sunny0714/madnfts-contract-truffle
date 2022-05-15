// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";
import "./LibRoyalties.sol";
import "./IRoyalties.sol";

abstract contract RoyaltiesUpgradeable is ERC165StorageUpgradeable, IRoyalties {

    function __RoyaltiesUpgradeable_init_unchained() internal initializer {
        _registerInterface(LibRoyalties._INTERFACE_ID_ROYALTIES);
    }
}
