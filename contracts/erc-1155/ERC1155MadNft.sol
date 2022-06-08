// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./ERC1155Base.sol";
import "../IsPrivateCollection.sol";
import "../WhitelistControl.sol";

contract ERC1155MadNft is ERC1155Base, IsPrivateCollection, WhitelistControl {
    event CreateERC1155MadNft(address owner, string name, string symbol);
    event CreateERC1155MadNftUser(address owner, string name, string symbol);

    function __ERC1155MadNftUser_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external virtual {
        __ERC1155MadNft_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        isPrivate = true;
        emit CreateERC1155MadNftUser(_msgSender(), _name, _symbol);
    }
    
    function __ERC1155MadNft_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) external virtual {
        __ERC1155MadNft_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        isPrivate = false;
        emit CreateERC1155MadNft(_msgSender(), _name, _symbol);
    }

    function __ERC1155MadNft_init_unchained(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) internal initializer {
        __Ownable_init_unchained();
        __ERC1155Lazy_init_unchained();
        __ERC165_init_unchained();
        __Context_init_unchained();
        __Mint1155Validator_init_unchained();
        __ERC1155_init_unchained("");
        __HasContractURI_init_unchained(contractURI);
        __ERC1155Burnable_init_unchained();
        __RoyaltiesUpgradeable_init_unchained();
        __ERC1155Base_init_unchained(_name, _symbol);
        __WhitelistControl_init_unchained();
        _setBaseURI(baseURI);

        //setting default approver for transferProxies
        _setDefaultApproval(transferProxy, true);
        _setDefaultApproval(lazyTransferProxy, true);
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override {
        if (isPrivate){
          require(owner() == data.creators[0].account || isWhitelist(data.creators[0].account), "not owner or whitelisted user");
        }
        super.mintAndTransfer(data, to, _amount);
    }
}
