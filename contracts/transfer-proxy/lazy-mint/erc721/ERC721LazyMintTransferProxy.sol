// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../../../exchange-interfaces/ITransferProxy.sol";
import "../../../lazy-mint/erc-721/LibERC721LazyMint.sol";
import "../../../lazy-mint/erc-721/IERC721LazyMint.sol";
import "../../roles/OperatorRole.sol";

contract ERC721LazyMintTransferProxy is OperatorRole, ITransferProxy {
    function transfer(LibAsset.Asset memory asset, address from, address to) override onlyOperator external {
        require(asset.value == 1, "erc721 value error");
        (address token, LibERC721LazyMint.Mint721Data memory data) = abi.decode(asset.assetType.data, (address, LibERC721LazyMint.Mint721Data));
        IERC721LazyMint(token).transferFromOrMint(data, from, to);
    }
}
