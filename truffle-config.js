const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },
    goerli: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY,
          `https://eth-goerli.g.alchemy.com/v2/FL_RXonM_iAhIMhE3Rl7LTR9uS1LsghT`, // Alchemy RPC URL (API_KEY)
        ),
      network_id: 5, // Goerli's network id
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  compilers: {
    solc: {
      version: "0.8.9",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
