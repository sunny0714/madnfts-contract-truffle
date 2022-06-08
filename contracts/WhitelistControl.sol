// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract WhitelistControl is OwnableUpgradeable {
    mapping(address => bool) private _whitelist;
    
    event WhitelistStatusChanged(address indexed user, bool indexed status);

    function __WhitelistControl_init() internal initializer {
        __Ownable_init_unchained();
        __WhitelistControl_init_unchained();
    }

    function __WhitelistControl_init_unchained() internal initializer {
    }

    /**
     * @dev Add `_users` to the whitelist.
     */
    function addWhitelist(address[] memory _users) external onlyOwner {
        uint256 length = _users.length;
        for (uint256 i = 0; i < length; i++)
        {
            _whitelist[_users[i]] = true;
            emit WhitelistStatusChanged(_users[i], true);
        }
    }

    /**
     * @dev Revoke `_users` from the whitelist.
     */
    function removeWhitelist(address[] memory _users) external onlyOwner {
        uint256 length = _users.length;
        for (uint256 i = 0; i < length; i++)
        {
            _whitelist[_users[i]] = false;
            emit WhitelistStatusChanged(_users[i], false);
        }
    }

    /**
     * @dev Returns `true` if `account` is on the whitelist.
     */
    function isWhitelist(address account) public view returns (bool) {
        return _whitelist[account];
    }

    uint256[50] private __gap;
}
