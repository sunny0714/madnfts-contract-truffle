// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./ERC721BurnableUpgradeable.sol";
import "./ERC721PausableUpgradeable.sol";
import "./ERC721DefaultApproval.sol";
import "./ERC721Lazy.sol";
import "../HasContractURI.sol";

abstract contract ERC721Base is OwnableUpgradeable, AccessControlUpgradeable, ERC721DefaultApproval, ERC721BurnableUpgradeable, ERC721PausableUpgradeable, ERC721Lazy, HasContractURI {

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function __ERC721Base_init() internal initializer {
        __ERC721Base_init_unchained();
    }

    function __ERC721Base_init_unchained() internal initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
    }

    event BaseUriChanged(string newBaseURI);

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal virtual override(ERC721Upgradeable, ERC721DefaultApproval) view returns (bool) {
        return ERC721DefaultApproval._isApprovedOrOwner(spender, tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override(ERC721DefaultApproval, ERC721Upgradeable, IERC721Upgradeable) returns (bool) {
        return ERC721DefaultApproval.isApprovedForAll(owner, operator);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlUpgradeable, ERC165StorageUpgradeable, ERC721Lazy) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _mint(address to, uint256 tokenId) internal override(ERC721Lazy, ERC721Upgradeable) {
        super._mint(to, tokenId);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        super._setBaseURI(newBaseURI);

        emit BaseUriChanged(newBaseURI);
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC721PauserAutoId: must have pauser role to pause");
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC721PauserAutoId: must have pauser role to unpause");
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable, ERC721PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    uint256[50] private __gap;
}
