// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./ERC721Base.sol";

contract ERC721MadNft is ERC721Base {

    event CreateERC721MadNft(address owner, string name, string symbol);

    function __ERC721MadNft_init(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address transferProxy,
        address lazyTransferProxy
    ) external initializer {
        __ERC721MadNft_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
        emit CreateERC721MadNft(_msgSender(), _name, _symbol);
    }

    function __ERC721MadNft_init_unchained(
        string memory _name, 
        string memory _symbol, 
        string memory baseURI, 
        string memory contractURI, 
        address transferProxy, 
        address lazyTransferProxy
    ) internal {
        _setBaseURI(baseURI);
        __ERC721Lazy_init_unchained();
        __RoyaltiesUpgradeable_init_unchained();
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC165Storage_init_unchained();
        __AccessControl_init_unchained();
        __Ownable_init_unchained();
        __ERC721Burnable_init_unchained();
        __Pausable_init_unchained();
        __ERC721Pausable_init_unchained();
        __Mint721Validator_init_unchained();
        __HasContractURI_init_unchained(contractURI);
        __ERC721Base_init_unchained();
        __ERC721_init_unchained(_name, _symbol);

        //setting default approver for transferProxies
        _setDefaultApproval(transferProxy, true);
        _setDefaultApproval(lazyTransferProxy, true);
    }

    uint256[50] private __gap;
}
