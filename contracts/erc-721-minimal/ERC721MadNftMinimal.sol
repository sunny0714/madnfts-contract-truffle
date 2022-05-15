// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./ERC721BaseMinimal.sol";
import "../IsPrivateCollection.sol";
import "../WhitelistControl.sol";

contract ERC721MadNftMinimal is ERC721BaseMinimal, IsPrivateCollection, WhitelistControl {
    event CreateERC721MadNft(address owner, string name, string symbol);
    event CreateERC721MadNftUser(address owner, string name, string symbol);

    function __ERC721MadNftUser_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external virtual {
        __ERC721MadNft_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        isPrivate = true;
        emit CreateERC721MadNftUser(_msgSender(), _name, _symbol);
    }

    function __ERC721MadNft_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) external virtual {
        __ERC721MadNft_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        isPrivate = false;
        emit CreateERC721MadNft(_msgSender(), _name, _symbol);
    }

    function __ERC721MadNft_init_unchained(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) internal initializer {
        _setBaseURI(baseURI);
        __ERC721Lazy_init_unchained();
        __RoyaltiesUpgradeable_init_unchained();
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC165Storage_init_unchained();
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

    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) public override virtual {
        if (isPrivate){
            require(owner() == data.creators[0].account || isWhitelist(data.creators[0].account), "not owner or whitelisted user");
        }
        super.mintAndTransfer(data, to);
    }
}
