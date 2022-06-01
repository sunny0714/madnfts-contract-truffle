const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC721MadNft = artifacts.require('ERC721MadNft');

module.exports = async function (deployer) {
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;
  await deployProxy(ERC721MadNft, ["MadNft", "MAD", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721MadNft_init' });
};