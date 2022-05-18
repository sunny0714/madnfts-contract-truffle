const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721MadNft = artifacts.require('ERC721MadNft');

module.exports = async function (deployer) {
  const transferProxy = "0x7171EB003B9Bc31EA67Ad6d892A78b85593ed8Ae";
  const erc721LazyMintTransferProxy = "0xf561B4734FDc5bfbD15c257E35d1EE40D8034e92";
  await deployProxy(ERC721MadNft, ["MadNft", "MAD", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721MadNft_init' });
};