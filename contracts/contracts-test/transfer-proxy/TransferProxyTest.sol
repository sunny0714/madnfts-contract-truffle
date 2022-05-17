// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "../../../contracts/exchange-interfaces/INftTransferProxy.sol";

contract TransferProxyTest is INftTransferProxy {

    function erc721safeTransferFrom(IERC721Upgradeable token, address from, address to, uint256 tokenId) override external {
        token.safeTransferFrom(from, to, tokenId);
    }

    function erc1155safeTransferFrom(IERC1155Upgradeable token, address from, address to, uint256 id, uint256 value, bytes calldata data) override external {
        token.safeTransferFrom(from, to, id, value, data);
    }
}
