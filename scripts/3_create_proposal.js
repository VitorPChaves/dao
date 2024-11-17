// scripts/3_create_proposal.js

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
    const voters = accounts.slice(2, 7); // Five voters
    const initialPaymentAmount = web3.utils.toWei("1000"); // Adjust amount as needed
    const finalPaymentAmount = web3.utils.toWei("1000");
    const initialProposalDescription =
      "Proposal to release initial payment for neighborhood services";
    const finalProposalDescription =
      "Proposal to release final payment after job completion";

    // **Step 1: Check Proposer's VoteToken Balance**
    console.log("Step 1: Checking proposer's VoteToken balance...\n");
    const proposerBalance = await voteToken.balanceOf(proposer);
    console.log(`Proposer's VoteToken balance: ${proposerBalance.toString()}`);
    if (proposerBalance.toString() === "0") {
      throw new Error("Proposer does not have VoteToken balance.");
    }

    // **Check Voters' VoteToken Balances**
    console.log("Checking voters' VoteToken balances...\n");
    for (const voter of voters) {
      const balance = await voteToken.balanceOf(voter);
      console.log(`Voter ${voter} has ${balance.toString()} VoteToken(s).`);
      if (balance.toString() === "0") {
        throw new Error(`Voter ${voter} does not have VoteToken balance.`);
      }
    }

    // **Step 2: Create Initial Payment Proposal**
    console.log("Step 2: Creating initial payment proposal...\n");
    const initialFunctionCall = treasury.contract.methods
      .releaseInitialPayment(initialPaymentAmount)
      .encodeABI();

    const initialProposalTx = await governance.propose(
      [treasury.address],
      [0],
      [initialFunctionCall],
      initialProposalDescription,
      { from: proposer },
    );
    const initialProposalId = initialProposalTx.logs[0].args.id.toString();
    console.log(
      `Initial payment proposal created successfully! Proposal ID: ${initialProposalId}\n`,
    );

    // **Step 3: Simulate Voting on Initial Proposal**
    console.log("Step 3: Simulating voting on initial proposal...\n");
    await simulateVoting(governance, voteToken, initialProposalId, voters);

    // **Step 4: Advance Blocks to End Voting Period**
    console.log("Step 4: Advancing blocks to end voting period...\n");
    const initialProposal = await governance.proposals(initialProposalId);
    const currentBlockNumber = await web3.eth.getBlockNumber();
    const blocksToAdvance =
      parseInt(initialProposal.endBlock) - currentBlockNumber + 1;
    await advanceBlocks(blocksToAdvance);
    console.log(`Advanced ${blocksToAdvance} blocks.\n`);

    // **Check Proposal State After Advancing Blocks**
    const proposalState = await governance.getProposalState(initialProposalId);
    console.log(
      `Proposal state after advancing blocks: ${proposalState.toString()}`,
    );

    if (proposalState.toString() !== "3") {
      throw new Error("Proposal is not in a succeeded state. Cannot execute.");
    }

    // **Step 5: Execute Initial Payment Proposal**
    console.log("Step 5: Executing initial payment proposal...\n");
    await executeProposal(governance, initialProposalId, proposer);
    console.log("Initial payment executed successfully.\n");

    // **Service Provider Confirms Completion**
    console.log("Service provider confirming completion of service...\n");
    const serviceProvider = accounts[1]; // Ensure this is the correct service provider
    await treasury.confirmCompletion({ from: serviceProvider });

    // **Step 6: Create Final Payment Proposal**
    console.log("Step 6: Creating final payment proposal...\n");
    const finalFunctionCall = treasury.contract.methods
      .releaseFinalPayment(finalPaymentAmount)
      .encodeABI();

    const finalProposalTx = await governance.propose(
      [treasury.address],
      [0],
      [finalFunctionCall],
      finalProposalDescription,
      { from: proposer },
    );
    const finalProposalId = finalProposalTx.logs[0].args.id.toString();
    console.log(
      `Final payment proposal created successfully. Proposal ID: ${finalProposalId}\n`,
    );

    // **Step 7: Simulate Voting on Final Proposal**
    console.log("Step 7: Simulating voting on final proposal...\n");
    await simulateVoting(governance, voteToken, finalProposalId, voters);

    // **Step 8: Advance Blocks to End Voting Period**
    console.log("Step 8: Advancing blocks to end voting period...\n");
    const finalProposal = await governance.proposals(finalProposalId);
    const blocksToAdvanceFinal =
      parseInt(finalProposal.endBlock) - (await web3.eth.getBlockNumber()) + 1;
    await advanceBlocks(blocksToAdvanceFinal);

    // **Step 9: Execute Final Payment Proposal**
    console.log("Step 9: Executing final payment proposal...\n");
    await executeProposal(governance, finalProposalId, proposer);
    console.log("Final payment executed successfully. Process complete.\n");

    callback();
  } catch (error) {
    console.error("Error in proposal process:", error);
    callback(error);
  }
};

// **Advance Blocks Utility**
async function advanceBlocks(blocks) {
  for (let i = 0; i < blocks; i++) {
    await new Promise((resolve, reject) => {
      web3.currentProvider.send(
        { jsonrpc: "2.0", method: "evm_mine", id: Date.now() + i },
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        },
      );
    });
  }
  console.log(`Advanced ${blocks} blocks.\n`);
}

// **Simulate Voting Function**
async function simulateVoting(governance, voteToken, proposalId, voters) {
  // Ensure voters have VoteTokens
  for (const voter of voters) {
    const balance = await voteToken.balanceOf(voter);
    if (balance.toString() === "0") {
      throw new Error(`Voter ${voter} does not have VoteToken balance.`);
    }
  }

  // Voters cast their votes
  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i];
    await governance.vote(proposalId, true, { from: voter });
    console.log(`Voter ${voter} voted in favor.`);
  }

  console.log("All votes cast successfully.\n");
}

// **Execute Proposal Function**
async function executeProposal(governance, proposalId, executor) {
  try {
    await governance.executeProposal(proposalId, { from: executor });
  } catch (error) {
    console.error(`Failed to execute proposal ${proposalId}:`, error);
    throw error;
  }
}
