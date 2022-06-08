// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./ERC721BurnableUpgradeableMinimal.sol";
import "./ERC721PausableUpgradeableMinimal.sol";
import "./ERC721DefaultApprovalMinimal.sol";
import "./ERC721LazyMinimal.sol";
import "../HasContractURI.sol";

abstract contract ERC721BaseMinimal is OwnableUpgradeable, AccessControlUpgradeable, ERC721DefaultApprovalMinimal, ERC721BurnableUpgradeableMinimal, ERC721PausableUpgradeableMinimal, ERC721LazyMinimal, HasContractURI {
    
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function __ERC721Base_init() internal initializer {
        __ERC721Base_init_unchained();
    }

    function __ERC721Base_init_unchained() internal initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
    }

    event BaseUriChanged(string newBaseURI);

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal virtual override(ERC721UpgradeableMinimal, ERC721DefaultApprovalMinimal) view returns (bool) {
        return ERC721DefaultApprovalMinimal._isApprovedOrOwner(spender, tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override(ERC721DefaultApprovalMinimal, ERC721UpgradeableMinimal, IERC721Upgradeable) returns (bool) {
        return ERC721DefaultApprovalMinimal.isApprovedForAll(owner, operator);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlUpgradeable, ERC165StorageUpgradeable, ERC721LazyMinimal) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721UpgradeableMinimal, ERC721LazyMinimal) returns (string memory) {
        return ERC721LazyMinimal.tokenURI(tokenId);
    }

    function _clearMetadata(uint256 tokenId) internal override(ERC721UpgradeableMinimal, ERC721LazyMinimal) virtual {
        return ERC721LazyMinimal._clearMetadata(tokenId);
    }

    function _emitMintEvent(address to, uint tokenId) internal override(ERC721UpgradeableMinimal, ERC721LazyMinimal) virtual {
        return ERC721LazyMinimal._emitMintEvent(to, tokenId);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        super._setBaseURI(newBaseURI);

        emit BaseUriChanged(newBaseURI);
    }

    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC721PauserAutoId: must have pauser role to pause");
        _pause();
    }

    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC721PauserAutoId: must have pauser role to unpause");
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721UpgradeableMinimal, ERC721PausableUpgradeableMinimal) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    uint256[50] private __gap;
}
