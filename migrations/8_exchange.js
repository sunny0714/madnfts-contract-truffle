const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const Exchange = artifacts.require('Exchange');
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const TransferProxy = artifacts.require('TransferProxy');

module.exports = async function (deployer) {
  const communityWallet = "0x626f88C72f848F978E7E9cDf915D18e1E513F51A";

  const transferProxy = (await TransferProxy.deployed()).address;
  const erc20TransferProxy = (await ERC20TransferProxy.deployed()).address;
  const royaltiesRegistry = (await RoyaltiesRegistry.deployed()).address;

  const exchange = await deployProxy(
    Exchange,
    [transferProxy, erc20TransferProxy, 0, communityWallet, royaltiesRegistry],
    { deployer, initializer: '__Exchange_init' }
  );
  console.log("deployed exchange at", exchange.address)
};