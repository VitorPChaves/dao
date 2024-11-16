// Deployment Script (2_deploy_contracts.js)
const VoteToken = artifacts.require("VoteToken");
const Treasury = artifacts.require("Treasury");
const BairroGovernance = artifacts.require("BairroGovernance");

module.exports = async function (deployer, network, accounts) {
  const [executor, proposer, ...voters] = accounts;

  // Step 1: Deploy the VoteToken contract
  await deployer.deploy(VoteToken);
  const voteToken = await VoteToken.deployed();
  console.log(`VoteToken deployed at: ${voteToken.address}`);

  // Step 2: Deploy the Treasury contract
  await deployer.deploy(Treasury, voteToken.address, executor); // Adjust params if needed
  const treasury = await Treasury.deployed();
  console.log(`Treasury deployed at: ${treasury.address}`);

  // Step 3: Deploy the BairroGovernance contract
  await deployer.deploy(BairroGovernance, voteToken.address, treasury.address);
  const governance = await BairroGovernance.deployed();
  console.log(`BairroGovernance deployed at: ${governance.address}`);

  // Step 4: Transfer Treasury ownership to BairroGovernance
  await treasury.transferOwnership(governance.address);
  console.log("Transferred Treasury ownership to BairroGovernance.");

  // Step 5: Mint and distribute tokens to proposer and voters
  const proposerTokens = web3.utils.toWei("10", "ether"); // Mint 10 VOTE for proposer
  await voteToken.mint(proposer, proposerTokens);
  console.log(
    `Minted ${web3.utils.fromWei(proposerTokens, "ether")} VOTE tokens to proposer: ${proposer}`,
  );

  // Mint 1 VOTE for each voter
  for (const voter of voters) {
    await voteToken.mint(voter, web3.utils.toWei("100", "ether"));
    console.log(`Minted 1 VOTE token to voter: ${voter}`);
  }

  console.log("Deployment complete!");
};
