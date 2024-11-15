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
    const voters = accounts.slice(2, 7);
    const initialPaymentAmount = web3.utils.toWei("50", "mwei");
    const finalPaymentAmount = web3.utils.toWei("50", "mwei");
    const initialProposalDescription =
      "Proposal to release initial payment for neighborhood services";
    const finalProposalDescription =
      "Proposal to release final payment after job completion";

    console.log("Step 1: Checking balances and delegating tokens...\n");

    await voteToken.delegate(proposer, { from: proposer });
    console.log("Tokens delegated to proposer.");

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
    let proposalState = await governance.state(initialProposalId);
    console.log(`Proposal state after creation: ${proposalState} (1 = Active)`);

    if (proposalState.toString() !== "1") {
      console.log(
        "Proposal is not active yet. Fast-forwarding to voting period...\n",
      );

      // Check voting delay
      const votingDelay = await governance.votingDelay();
      console.log(`Voting delay: ${votingDelay.toString()} blocks.`);

      // Fast-forward to the voting period
      await advanceBlocks(votingDelay.toNumber());
      console.log(
        `Fast-forwarded ${votingDelay.toString()} blocks to reach voting period.`,
      );

      // Recheck the state after advancing blocks
      proposalState = await governance.state(initialProposalId);
      console.log(`Rechecked proposal state: ${proposalState} (1 = Active)`);

      if (proposalState.toString() !== "1") {
        throw new Error("Proposal is still not active. Voting cannot proceed.");
      }
    }

    console.log("Step 4: Simulating voting...\n");

    await governance.castVote(initialProposalId, 1, { from: voters[0] });
    await governance.castVote(initialProposalId, 1, { from: voters[1] });
    await governance.castVote(initialProposalId, 1, { from: voters[2] });
    await governance.castVote(initialProposalId, 0, { from: voters[3] });
    await governance.castVote(initialProposalId, 2, { from: voters[4] });

    console.log("Votes cast successfully.\n");

    console.log("Step 5: Advancing blocks to conclude voting period...\n");

    await advanceBlocks(199152);

    console.log("Step 6: Executing initial payment proposal...\n");

    await governance.execute(
      [treasury.address],
      [0],
      [initialFunctionCall],
      initialDescriptionHash,
      { from: proposer },
    );

    console.log("Initial payment executed successfully.\n");

    console.log("Step 7: Checking for existing final payment proposal...\n");

    const finalDescriptionHash = web3.utils.sha3(finalProposalDescription);

    console.log("Step 8: Creating a proposal for final payment...\n");

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
      `Final payment proposal created successfully. ID: ${finalProposalId}\n`,
    );

    console.log("Step 9: Simulating voting for final payment...\n");

    await governance.castVote(finalProposalId, 1, { from: voters[0] });
    await governance.castVote(finalProposalId, 1, { from: voters[1] });
    await governance.castVote(finalProposalId, 1, { from: voters[2] });
    await governance.castVote(finalProposalId, 0, { from: voters[3] });
    await governance.castVote(finalProposalId, 2, { from: voters[4] });

    console.log("Votes cast for final payment.\n");

    console.log(
      "Step 10: Advancing blocks to conclude voting period for final payment...\n",
    );

    await advanceBlocks(199152);

    const finalProposalState = await governance.state(finalProposalId);
    if (finalProposalState.toString() !== "4") {
      console.log("Final payment proposal did not pass.");
      return callback();
    }

    console.log("Step 11: Executing final payment proposal...\n");

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
  await web3.currentProvider.send(
    { method: "evm_increaseTime", params: [blocks * 13] },
    () => {},
  );
  await web3.currentProvider.send({ method: "evm_mine", params: [] }, () => {});
  console.log(`Fast-forwarded ${blocks} blocks.`);
}
