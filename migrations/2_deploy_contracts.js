const BairroGovernance = artifacts.require("BairroGovernance");
const Treasury = artifacts.require("Treasury");
const VoteToken = artifacts.require("VoteToken");

module.exports = async function (deployer, network, accounts) {
  try {
    // Deploy VoteToken
    await deployer.deploy(VoteToken);
    const voteToken = await VoteToken.deployed();
    console.log(`VoteToken deployed at: ${voteToken.address}`);

    // Define the service provider and fund token for Treasury
    const serviceProvider = accounts[1]; // Example: Second account as service provider
    const fundToken = voteToken; // Use VoteToken as the funding token

    // Deploy Treasury
    await deployer.deploy(Treasury, fundToken.address, serviceProvider);
    const treasury = await Treasury.deployed();
    console.log(`Treasury deployed at: ${treasury.address}`);

    // Deploy BairroGovernance
    await deployer.deploy(BairroGovernance, voteToken.address, accounts[0]);
    const governance = await BairroGovernance.deployed();
    console.log(`BairroGovernance deployed at: ${governance.address}`);

    // Transfer Treasury ownership to Governance
    await treasury.transferOwnership(governance.address);
    console.log("Transferred Treasury ownership to BairroGovernance.");

    // Distribute tokens and perform initial setup
    const proposer = accounts[2];
    const voters = accounts.slice(3, 8); // Five voters
    const voteAmount = web3.utils.toWei("100", "ether"); // 100 VOTE per account
    const fundAmount = web3.utils.toWei("1000000", "ether"); // 1M for the Treasury

    console.log("\nMinting tokens and funding Treasury...\n");

    // Mint tokens to the Treasury
    await voteToken.mint(treasury.address, fundAmount);
    console.log(`Minted ${fundAmount} VOTE to Treasury: ${treasury.address}`);

    // Mint tokens to the proposer
    await voteToken.mint(proposer, voteAmount);
    console.log(`Minted ${voteAmount} VOTE to proposer: ${proposer}`);

    // Delegate tokens to the proposer
    await voteToken.delegate(proposer, { from: proposer });
    console.log(`Delegated tokens to proposer: ${proposer}`);

    // Mint tokens to voters
    for (const voter of voters) {
      await voteToken.mint(voter, voteAmount);
      console.log(`Minted ${voteAmount} VOTE to voter: ${voter}`);
    }

    console.log("\nDeployment complete!\n");
  } catch (error) {
    console.error("Error in deployment process:", error);
    process.exit(1);
  }
};
