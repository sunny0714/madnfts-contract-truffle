const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC1155MadNft = artifacts.require('ERC1155MadNft');

module.exports = async function (deployer) {
	const erc1155LazyMintTransferProxy = "0xA93FeC28d7C808e014FceaeD0F1D1d6eDcE84b4b";
	const transferProxy = "0x7171EB003B9Bc31EA67Ad6d892A78b85593ed8Ae";

  await deployProxy(ERC1155MadNft, ["MadNft", "MAD", "ipfs:/", "", transferProxy, erc1155LazyMintTransferProxy], { deployer, initializer: '__ERC1155MadNft_init' });
};