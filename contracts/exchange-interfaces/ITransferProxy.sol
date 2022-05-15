// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../LibAsset.sol";

interface ITransferProxy {
    function transfer(LibAsset.Asset calldata asset, address from, address to) external;
}
