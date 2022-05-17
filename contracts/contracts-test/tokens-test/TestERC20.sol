// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {

    }

    function mint(address to, uint amount) external {
        _mint(to, amount);
    }
}
