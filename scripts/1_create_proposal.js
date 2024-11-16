const BairroGovernance = artifacts.require("BairroGovernance");
const Treasury = artifacts.require("Treasury");
const VoteToken = artifacts.require("VoteToken");

module.exports = async function (callback) {
  try {
    const governance = await BairroGovernance.deployed();
    const treasury = await Treasury.deployed();
    const voteToken = await VoteToken.deployed();

    const accounts = await web3.eth.getAccounts();
    const proposer = accounts[1];
    const voters = accounts.slice(2, 7); // Adjust number of voters
    const initialPaymentAmount = web3.utils.toWei("50", "mwei");
    const finalPaymentAmount = web3.utils.toWei("50", "mwei");
    const initialProposalDescription =
      "Proposal to release initial payment for neighborhood services";
    const finalProposalDescription =
      "Proposal to release final payment after job completion";

    // Step 1: Delegate tokens and check balances
    console.log("Step 1: Checking balances and delegating tokens...\n");

    await voteToken.delegate(proposer, { from: proposer });
    console.log("Tokens delegated to proposer.");

    // Advance block to update snapshot
    await advanceBlocks(1);
    console.log("Advanced one block for delegation snapshot update.");

    const proposerVotes = await governance.getVotes(
      proposer,
      (await web3.eth.getBlockNumber()) - 1,
    );
    console.log(
      `Proposer delegated votes: ${web3.utils.fromWei(proposerVotes.toString(), "ether")} VOTE`,
    );

    const proposalThreshold = await governance.proposalThreshold();
    console.log(
      `Proposal threshold: ${web3.utils.fromWei(proposalThreshold.toString(), "ether")} VOTE`,
    );

    if (proposerVotes.lt(proposalThreshold)) {
      throw new Error(
        "Proposer votes below proposal threshold. Cannot proceed.",
      );
    }

    // Step 2: Check for existing initial payment proposal
    console.log("Step 2: Checking for existing initial payment proposal...\n");
    const initialDescriptionHash = web3.utils.sha3(initialProposalDescription);

    // Step 3: Create initial payment proposal
    console.log("Step 3: Creating a proposal for initial payment...\n");

    const initialFunctionCall = await treasury.contract.methods
      .releaseInitialPayment(initialPaymentAmount)
      .encodeABI();
    const initialProposalTx = await governance.propose(
      [treasury.address],
      [0],
      [initialFunctionCall],
      initialProposalDescription,
      { from: proposer },
    );
    const initialProposalId =
      initialProposalTx.logs[0].args.proposalId.toString();
    console.log(
      `Initial payment proposal created successfully! Proposal ID: ${initialProposalId}`,
    );

    // Advance to voting period
    await advanceToVotingPeriod(governance, initialProposalId);

    // Step 4: Cast votes for initial payment proposal
    console.log("Step 4: Simulating voting...\n");
    await simulateVoting(governance, initialProposalId, voters);

    // Advance blocks to end voting
    console.log("Step 5: Advancing blocks to conclude voting period...\n");
    const votingPeriod = await governance.votingPeriod();
    await advanceBlocks(votingPeriod.toNumber());

    // Execute initial payment proposal
    console.log("Step 6: Executing initial payment proposal...\n");
    await governance.execute(
      [treasury.address],
      [0],
      [initialFunctionCall],
      initialDescriptionHash,
      { from: proposer },
    );
    console.log("Initial payment executed successfully.\n");

    // Step 7: Create final payment proposal
    console.log("Step 7: Creating a proposal for final payment...\n");
    const finalFunctionCall = await treasury.contract.methods
      .releaseFinalPayment(finalPaymentAmount)
      .encodeABI();
    const finalProposalTx = await governance.propose(
      [treasury.address],
      [0],
      [finalFunctionCall],
      finalProposalDescription,
      { from: proposer },
    );
    const finalProposalId = finalProposalTx.logs[0].args.proposalId.toString();
    console.log(
      `Final payment proposal created successfully. Proposal ID: ${finalProposalId}`,
    );

    // Advance to voting period
    await advanceToVotingPeriod(governance, finalProposalId);

    // Step 8: Cast votes for final payment proposal
    console.log("Step 8: Simulating voting for final payment...\n");
    await simulateVoting(governance, finalProposalId, voters);

    // Advance blocks to end voting
    console.log(
      "Step 9: Advancing blocks to conclude voting period for final payment...\n",
    );
    await advanceBlocks(votingPeriod.toNumber());

    // Execute final payment proposal
    console.log("Step 10: Executing final payment proposal...\n");
    const finalDescriptionHash = web3.utils.sha3(finalProposalDescription);
    await governance.execute(
      [treasury.address],
      [0],
      [finalFunctionCall],
      finalDescriptionHash,
      { from: proposer },
    );
    console.log("Final payment executed successfully. Process complete.\n");

    callback();
  } catch (error) {
    console.error("Error in proposal process:", error);
    callback(error);
  }
};

// Advance blocks utility
async function advanceBlocks(blocks) {
  for (let i = 0; i < blocks; i++) {
    await web3.currentProvider.send(
      { method: "evm_mine", params: [] },
      () => {},
    );
  }
  console.log(`Fast-forwarded ${blocks} blocks.`);
}

// Advance to voting period
async function advanceToVotingPeriod(governance, proposalId) {
  const proposalState = await governance.state(proposalId);
  if (proposalState.toString() !== "1") {
    const votingDelay = await governance.votingDelay();
    console.log(`Voting delay: ${votingDelay.toString()} blocks.`);
    await advanceBlocks(votingDelay.toNumber());
    console.log(
      `Fast-forwarded ${votingDelay.toString()} blocks to reach voting period.`,
    );

    const recheckedState = await governance.state(proposalId);
    console.log(`Rechecked proposal state: ${recheckedState} (1 = Active)`);
    if (recheckedState.toString() !== "1") {
      throw new Error("Proposal is still not active. Voting cannot proceed.");
    }
  }
}

// Simulate voting
async function simulateVoting(governance, proposalId, voters) {
  const voteFor = 1; // 'For'
  const voteAgainst = 0; // 'Against'
  const voteAbstain = 2; // 'Abstain'

  await governance.castVote(proposalId, voteFor, { from: voters[0] });
  await governance.castVote(proposalId, voteFor, { from: voters[1] });
  await governance.castVote(proposalId, voteFor, { from: voters[2] });
  await governance.castVote(proposalId, voteAgainst, { from: voters[3] });
  await governance.castVote(proposalId, voteAbstain, { from: voters[4] });

  console.log("Votes cast successfully.\n");
}
