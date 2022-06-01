const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155MadNft = artifacts.require('ERC1155MadNft');

module.exports = async function (deployer) {
	const erc1155LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
	const transferProxy = (await TransferProxy.deployed()).address;

  await deployProxy(ERC1155MadNft, ["MadNft", "MAD", "ipfs:/", "", transferProxy, erc1155LazyMintTransferProxy], { deployer, initializer: '__ERC1155MadNft_init' });
};