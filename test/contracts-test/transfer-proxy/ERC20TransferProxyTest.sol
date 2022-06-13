// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../../contracts/exchange-interfaces/IERC20TransferProxy.sol";

contract ERC20TransferProxyTest is IERC20TransferProxy {

    function erc20safeTransferFrom(IERC20Upgradeable token, address from, address to, uint256 value) override external {
        require(token.transferFrom(from, to, value), "failure while transferring");
    }
}
