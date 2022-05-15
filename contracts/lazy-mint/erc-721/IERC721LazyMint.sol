// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./LibERC721LazyMint.sol";
import "../../royalties/LibPart.sol";

interface IERC721LazyMint is IERC721Upgradeable {

    event Creators(
        uint256 tokenId,
        LibPart.Part[] creators
    );

    function mintAndTransfer(
        LibERC721LazyMint.Mint721Data memory data,
        address to
    ) external;

    function transferFromOrMint(
        LibERC721LazyMint.Mint721Data memory data,
        address from,
        address to
    ) external;
}
