// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./ExchangeCore.sol";
import "./MadNftTransferManager.sol";
import "../royalties/IRoyaltiesProvider.sol";

contract Exchange is ExchangeCore, MadNftTransferManager {
    function __Exchange_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __MadNftTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
    }
}