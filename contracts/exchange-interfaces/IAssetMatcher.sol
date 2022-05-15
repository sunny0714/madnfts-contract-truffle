// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../LibAsset.sol";

interface IAssetMatcher {
    function matchAssets(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) external view returns (LibAsset.AssetType memory);
}
