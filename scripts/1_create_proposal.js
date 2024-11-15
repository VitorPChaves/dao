const BairroGovernance = artifacts.require("BairroGovernance");
const Treasury = artifacts.require("Treasury");

module.exports = async function (callback) {
    try {
        const governance = await BairroGovernance.deployed();
        const treasury = await Treasury.deployed();

        // Retrieve accounts
        const accounts = await web3.eth.getAccounts();
        const proposer = accounts[1]; // Example: use the second account as the proposer
        const voters = accounts.slice(2, 7); // Example: 5 voters
        const initialPaymentAmount = web3.utils.toWei("50", "mwei"); // 50 BRZ (assuming BRZ uses 6 decimals)
        const proposalDescription =
            "Proposal to release initial payment for neighborhood services";

        console.log("Step 1: Preparing to create a proposal...\n");

        // Step 1: Encode the function call to release initial payment
        const encodedFunctionCall = await treasury.contract.methods
            .releaseInitialPayment(initialPaymentAmount)
            .encodeABI();

        // Step 2: Submit the proposal
        const proposalTx = await governance.propose(
            [treasury.address], // Targets: The Treasury contract
            [0], // Values: No ETH transfer with the call
            [encodedFunctionCall], // Calldatas: Encoded function call
            proposalDescription, // Description: Proposal details
            { from: proposer } // Proposer account
        );

        const proposalId = proposalTx.logs[0].args.proposalId;
        console.log(
            `Proposal created successfully! Proposal ID: ${proposalId.toString()}\n`
        );
        console.log(`Proposal Description: ${proposalDescription}`);

        // Step 3: Voting process
        console.log("Step 2: Casting votes...\n");

        // Simulating voting: voters 2, 3, and 4 vote 'For', voter 5 votes 'Against', voter 6 abstains
        const voteFor = 1; // 'For'
        const voteAgainst = 0; // 'Against'
        const voteAbstain = 2; // 'Abstain'

        await governance.castVote(proposalId, voteFor, { from: voters[0] }); // Voter 2
        await governance.castVote(proposalId, voteFor, { from: voters[1] }); // Voter 3
        await governance.castVote(proposalId, voteFor, { from: voters[2] }); // Voter 4
        await governance.castVote(proposalId, voteAgainst, { from: voters[3] }); // Voter 5
        await governance.castVote(proposalId, voteAbstain, { from: voters[4] }); // Voter 6

        console.log("Votes have been cast.\n");

        // Step 4: Fast forward to the end of the 1-month voting period
        console.log(
            "Step 3: Fast-forwarding to the end of the voting period...\n"
        );
        await advanceBlocks(199152); // 1 month of blocks

        // Step 5: Check the proposal state
        const proposalState = await governance.state(proposalId);
        console.log(
            `Proposal state after voting: ${proposalState} (Succeeded = 4, Defeated = 3)\n`
        );

        if (proposalState.toString() !== "4") {
            console.log("Proposal did not succeed. Exiting.");
            return callback();
        }

        // Step 6: Queue and execute the proposal
        console.log("Step 4: Queueing and executing the proposal...\n");

        const descriptionHash = web3.utils.sha3(proposalDescription);

        await governance.queue(
            [treasury.address],
            [0],
            [encodedFunctionCall],
            descriptionHash,
            { from: proposer }
        );
        console.log("Proposal queued successfully.\n");

        await governance.execute(
            [treasury.address],
            [0],
            [encodedFunctionCall],
            descriptionHash,
            { from: proposer }
        );
        console.log("Proposal executed successfully. Funds released.\n");

        // Step 7: Track funds
        const isInitialPaymentReleased =
            await treasury.isInitialPaymentReleased();
        const treasuryBalance = await web3.eth.getBalance(treasury.address);

        console.log(`Funds released? ${isInitialPaymentReleased}`);
        console.log(
            `Remaining funds in Treasury: ${web3.utils.fromWei(treasuryBalance, "ether")} ETH\n`
        );

        callback();
    } catch (error) {
        console.error("Error in proposal process:", error);
        callback(error);
    }
};

async function advanceBlocks(blocks) {
    await web3.currentProvider.send(
        {
            method: "evm_increaseTime",
            params: [blocks * 13], // Approx. 13 seconds per block
        },
        () => {}
    );
    await web3.currentProvider.send(
        {
            method: "evm_mine",
            params: [],
        },
        () => {}
    );
    console.log(`Fast-forwarded ${blocks} blocks.`);
}
