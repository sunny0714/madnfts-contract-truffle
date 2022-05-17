const path = require("path");
require('dotenv').config({ path: './.env' });
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const web3 = new Web3();
const MetaMaskAccountIndex = 0;

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 7545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(process.env.MNEMONIC, "wss://rinkeby.infura.io/ws/v3/239a6062fd364546bdceba84ab5e75fb", MetaMaskAccountIndex)
      },
      network_id: 4,
      gasPrice: web3.utils.toWei('30', 'gwei'),
      gas: 5000000,
      timeoutBlocks: 250,
      networkCheckTimeout: 999999,
      skipDryRun: true
    },
    testnetHar: {
      provider: () => {
        return new HDWalletProvider(process.env.MNEMONIC, "https://api.s0.b.hmny.io", MetaMaskAccountIndex)
      },
      network_id: 1666700000,
      // gasPrice: web3.utils.toWei('30', 'gwei'),
      // gas: 8000000,
      // timeoutBlocks: 250,
      // networkCheckTimeout: 999999
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
       evmVersion: "istanbul"
      }
    }
  },
  plugins: [
    'truffle-plugin-verify',
  ],
  api_keys: {
    etherscan: process.env.API_KEY
  }
};
