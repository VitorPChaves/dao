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
    const initialPaymentAmount = web3.utils.toWei("50", "mwei");
    const initialProposalDescription = "Proposal to release initial payment";

    console.log("\nStep 1: Checking balances and delegating tokens...\n");

    // Ensure the proposer has enough VOTE tokens
    const proposerBalance = await voteToken.balanceOf(proposer);
    console.log(`Proposer token balance: ${proposerBalance.toString()} VOTE`);

    if (proposerBalance.toString() === "0") {
      throw new Error("Proposer has no VOTE tokens. Ensure tokens are minted.");
    }

    // Delegate tokens to the proposer
    await voteToken.delegate(proposer, { from: proposer });
    console.log("Tokens delegated to proposer.");

    // Advance one block to ensure delegation snapshot update
    console.log("Fast-forwarding one block for snapshot update...\n");
    await advanceBlocks(1);

    // Check proposer delegated votes
    const proposerVotes = await governance.getVotes(
      proposer,
      await web3.eth.getBlockNumber(),
    );
    console.log(`Proposer delegated votes: ${proposerVotes.toString()} VOTE`);

    // Check the proposal threshold
    const proposalThreshold = await governance.proposalThreshold();
    console.log(`Proposal threshold: ${proposalThreshold.toString()} VOTE`);

    if (proposerVotes.lt(proposalThreshold)) {
      throw new Error(
        "Proposer votes below proposal threshold. Cannot proceed.",
      );
    }

    console.log("Delegation successful and above threshold.\n");

    console.log("\nStep 2: Creating a proposal for initial payment...\n");

    // Encode the initial payment function call
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
      `Initial payment proposal created. Proposal ID: ${initialProposalId}\n`,
    );

    callback();
  } catch (error) {
    console.error("Error in proposal process:", error);
    callback(error);
  }
};

// Utility to advance blocks
async function advanceBlocks(blocks) {
  for (let i = 0; i < blocks; i++) {
    await web3.currentProvider.send(
      { method: "evm_mine", params: [] },
      () => {},
    );
  }
  console.log(`Fast-forwarded ${blocks} blocks.`);
}
