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
    const voters = accounts.slice(2, 7); // Use 5 voters
    const initialPaymentAmount = web3.utils.toWei("50", "mwei");
    const finalPaymentAmount = web3.utils.toWei("50", "mwei");
    const initialProposalDescription =
      "Proposal to release initial payment for neighborhood services";
    const finalProposalDescription =
      "Proposal to release final payment after job completion";

    console.log("Step 1: Checking balances and delegating tokens...\n");

    // Mint tokens and check proposer balance
    const proposerBalance = await voteToken.balanceOf(proposer);
    console.log(
      `Proposer token balance: ${web3.utils.fromWei(proposerBalance.toString(), "ether")} VOTE`,
    );

    // Delegate tokens to proposer
    await voteToken.delegate(proposer, { from: proposer });
    console.log("Tokens delegated to proposer.");

    // Fast-forward one block to ensure delegation snapshot updates
    await advanceBlocks(1);
    console.log("Advanced one block for delegation snapshot update.");

    // Check proposer votes after delegation
    const proposerVotes = await voteToken.getVotes(proposer);
    console.log(
      `Proposer delegated votes: ${web3.utils.fromWei(proposerVotes.toString(), "ether")} VOTE`,
    );

    // Check proposal threshold
    const proposalThreshold = await governance.proposalThreshold();
    console.log(
      `Proposal threshold: ${web3.utils.fromWei(proposalThreshold.toString(), "ether")} VOTE`,
    );

    // Ensure proposer meets the threshold
    if (proposerVotes.lt(proposalThreshold)) {
      throw new Error(
        "Proposer votes below proposal threshold. Cannot proceed.",
      );
    }

    console.log("Step 2: Checking for existing initial payment proposal...\n");

    const initialDescriptionHash = web3.utils.sha3(initialProposalDescription);

    console.log("Step 3: Creating a proposal for initial payment...\n");

    const initialFunctionCall = await treasury.contract.methods
      .releaseInitialPayment(initialPaymentAmount)
      .encodeABI();

    // Submit the proposal for the initial payment
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
      `Initial payment proposal created successfully! Proposal ID: ${initialProposalId}\n`,
    );

    // Check the state of the proposal
    const initialProposalState = await governance.state(initialProposalId);
    console.log(
      `Proposal state after creation: ${initialProposalState} (1 = Active)`,
    );

    if (initialProposalState.toString() !== "1") {
      console.log(
        "Proposal is not active yet. Fast-forwarding to voting period...\n",
      );
      const votingDelay = await governance.votingDelay();
      console.log(`Voting delay: ${votingDelay.toString()} blocks.`);

      await advanceBlocks(votingDelay.toNumber());
      console.log(`Fast-forwarded ${votingDelay.toString()} blocks.`);
    }

    // Recheck the state after advancing blocks
    const recheckedProposalState = await governance.state(initialProposalId);
    console.log(
      `Rechecked proposal state: ${recheckedProposalState} (1 = Active)`,
    );

    if (recheckedProposalState.toString() !== "1") {
      throw new Error("Proposal is still not active. Voting cannot proceed.");
    }

    console.log("Step 4: Simulating voting...\n");

    // Cast votes
    await governance.castVote(initialProposalId, 1, { from: voters[0] }); // For
    await governance.castVote(initialProposalId, 1, { from: voters[1] }); // For
    await governance.castVote(initialProposalId, 0, { from: voters[2] }); // Against
    await governance.castVote(initialProposalId, 2, { from: voters[3] }); // Abstain
    console.log("Votes cast successfully.\n");

    console.log("Step 5: Advancing blocks to conclude voting period...\n");

    const votingPeriod = await governance.votingPeriod();
    await advanceBlocks(votingPeriod.toNumber());
    console.log(`Fast-forwarded ${votingPeriod.toString()} blocks.`);

    console.log("Step 6: Executing initial payment proposal...\n");

    await governance.execute(
      [treasury.address],
      [0],
      [initialFunctionCall],
      initialDescriptionHash,
      { from: proposer },
    );

    console.log("Initial payment executed successfully.\n");

    console.log("Step 7: Creating a proposal for final payment...\n");

    const finalDescriptionHash = web3.utils.sha3(finalProposalDescription);

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
      `Final payment proposal created successfully! Proposal ID: ${finalProposalId}\n`,
    );

    console.log("Step 8: Simulating voting for final payment...\n");

    // Cast votes
    await governance.castVote(finalProposalId, 1, { from: voters[0] }); // For
    await governance.castVote(finalProposalId, 1, { from: voters[1] }); // For
    await governance.castVote(finalProposalId, 0, { from: voters[2] }); // Against
    await governance.castVote(finalProposalId, 2, { from: voters[3] }); // Abstain
    console.log("Votes cast for final payment.\n");

    console.log(
      "Step 9: Advancing blocks to conclude voting period for final payment...\n",
    );

    await advanceBlocks(votingPeriod.toNumber());
    console.log(`Fast-forwarded ${votingPeriod.toString()} blocks.`);

    const finalProposalState = await governance.state(finalProposalId);
    console.log(`Final proposal state: ${finalProposalState} (4 = Succeeded)`);

    if (finalProposalState.toString() !== "4") {
      throw new Error("Final payment proposal did not pass.");
    }

    console.log("Step 10: Executing final payment proposal...\n");

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

async function advanceBlocks(blocks) {
  for (let i = 0; i < blocks; i++) {
    await web3.currentProvider.send(
      { method: "evm_mine", params: [] },
      () => {},
    );
  }
  console.log(`Fast-forwarded ${blocks} blocks.`);
}
