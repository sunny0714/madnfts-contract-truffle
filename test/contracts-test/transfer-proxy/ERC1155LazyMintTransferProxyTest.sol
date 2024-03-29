// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../../contracts/exchange-interfaces/ITransferProxy.sol";
import "../../../contracts/lazy-mint/erc-1155/LibERC1155LazyMint.sol";
import "../../../contracts/lazy-mint/erc-1155/IERC1155LazyMint.sol";
import "./OperatorRoleTest.sol";

contract ERC1155LazyMintTransferProxyTest is OperatorRoleTest, ITransferProxy {
    function transfer(LibAsset.Asset memory asset, address from, address to) override onlyOperator external {
        (address token, LibERC1155LazyMint.Mint1155Data memory data) = abi.decode(asset.assetType.data, (address, LibERC1155LazyMint.Mint1155Data));
        IERC1155LazyMint(token).transferFromOrMint(data, from, to, asset.value);
    }
}
