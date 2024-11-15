const VoteToken = artifacts.require("VoteToken");
const Treasury = artifacts.require("Treasury");
const BairroGovernance = artifacts.require("BairroGovernance");

module.exports = async function (deployer, network, accounts) {
  const [executor, proposer, serviceProvider, ...voters] = accounts;

  // Step 1: Deploy the VoteToken contract
  await deployer.deploy(VoteToken);
  const voteToken = await VoteToken.deployed();

  // Delegate tokens to the proposer
  await voteToken.delegate(proposer, { from: proposer });
  console.log("VoteToken deployed at:", voteToken.address);

  // Step 2: Deploy the Treasury contract
  await deployer.deploy(Treasury, voteToken.address, serviceProvider);
  const treasury = await Treasury.deployed();
  console.log("Treasury deployed at:", treasury.address);

  // Step 3: Deploy the BairroGovernance contract
  await deployer.deploy(BairroGovernance, voteToken.address, treasury.address);
  const bairroGovernance = await BairroGovernance.deployed();
  console.log("BairroGovernance deployed at:", bairroGovernance.address);

  // Step 4: Transfer ownership of Treasury to BairroGovernance
  await treasury.transferOwnership(bairroGovernance.address, {
    from: executor,
  });
  console.log("Treasury ownership transferred to BairroGovernance.");

  // Step 4: Mint and distribute tokens to proposer
  const proposerTokens = web3.utils.toWei("50", "ether"); // Allocate 50 VOTE tokens
  await voteToken.transfer(proposer, proposerTokens, { from: executor });
  console.log(
    `Allocated ${web3.utils.fromWei(proposerTokens)} VOTE tokens to proposer: ${proposer}`,
  );

  // Step 6: Mint and distribute tokens to voters
  const voterAllocation = web3.utils.toWei("100", "ether");
  for (const voter of voters) {
    await voteToken.transfer(voter, voterAllocation, { from: executor });
    console.log(
      `Allocated ${web3.utils.fromWei(
        voterAllocation,
      )} VOTE tokens to voter: ${voter}`,
    );
  }

  const treasuryBalance = await voteToken.balanceOf(treasury.address);
  console.log(
    `Treasury Balance: ${web3.utils.fromWei(treasuryBalance, "mwei")} BRZ`,
  );

  console.log("Deployment complete!");
};
