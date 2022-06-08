// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IRoyalties {
    event SecondarySaleFees(uint256 tokenId, address[] recipients, uint[] bps);

    function getFeeRecipients(uint256 id) external view returns (address payable[] memory);
    function getFeeBps(uint256 id) external view returns (uint[] memory);
}
