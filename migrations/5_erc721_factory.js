const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const { getProxyImplementation } = require("./config.js")

const ERC721MadNftMinimal = artifacts.require('ERC721MadNftMinimal');

const ERC721MadNftFactory = artifacts.require('ERC721MadNftFactory');

const ERC721MadNftMinimalBeacon = artifacts.require('ERC721MadNftMinimalBeacon');

const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');

module.exports = async function (deployer) {
  // disable this when deploying in all to avoid deploying twice
  await deployer.deploy(TransferProxy, { gas: 1500000 });
  await deployer.deploy(ERC721LazyMintTransferProxy, { gas: 1500000 });
  
  const transferProxy = (await TransferProxy.deployed()).address;
  const erc721LazyMintTransferProxy = (await ERC721LazyMintTransferProxy.deployed()).address;

  //deploying erc721 minimal
  const erc721Proxy = await deployProxy(ERC721MadNftMinimal, ["MadNft", "MAD", "ipfs:/", "", transferProxy, erc721LazyMintTransferProxy], { deployer, initializer: '__ERC721MadNft_init' });
  console.log("deployed erc721 minimal at", erc721Proxy.address)

  const erc721minimal = await getProxyImplementation(ERC721MadNftMinimal, ProxyAdmin)

  //upgrading 721 beacon
  await deployer.deploy(ERC721MadNftMinimalBeacon, erc721minimal, { gas: 1000000 });
  const beacon721Minimal = await ERC721MadNftMinimalBeacon.deployed()

  //deploying factory
  const factory721 = await deployer.deploy(ERC721MadNftFactory, beacon721Minimal.address, transferProxy, erc721LazyMintTransferProxy, { gas: 2500000 });
  console.log(`deployed factory721 minimal at ${factory721.address}`)
  
};
