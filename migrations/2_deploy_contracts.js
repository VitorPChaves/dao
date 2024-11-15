const VoteToken = artifacts.require("VoteToken");
const Treasury = artifacts.require("Treasury");
const BairroGovernance = artifacts.require("BairroGovernance");

module.exports = async function (deployer, network, accounts) {
    const [executor, proposer, serviceProvider, ...voters] = accounts;

    // Step 1: Deploy the VoteToken contract
    await deployer.deploy(VoteToken);
    const voteToken = await VoteToken.deployed();
    console.log("VoteToken deployed at:", voteToken.address);

    // Step 2: Deploy the Treasury contract
    const totalFunds = web3.utils.toWei("100", "ether");
    await deployer.deploy(Treasury, voteToken.address, serviceProvider);
    const treasury = await Treasury.deployed();
    console.log("Treasury deployed at:", treasury.address);

    // Step 3: Deploy the BairroGovernance contract
    await deployer.deploy(
        BairroGovernance,
        voteToken.address,
        treasury.address
    );
    const bairroGovernance = await BairroGovernance.deployed();
    console.log("BairroGovernance deployed at:", bairroGovernance.address);

    // Step 4: Transfer ownership of Treasury to BairroGovernance
    await treasury.transferOwnership(bairroGovernance.address, {
        from: executor,
    });
    console.log("Treasury ownership transferred to BairroGovernance.");

    // Step 5: Mint and distribute tokens to voters
    const voterAllocation = web3.utils.toWei("100", "ether");
    for (const voter of voters) {
        await voteToken.transfer(voter, voterAllocation, { from: executor });
        console.log(
            `Allocated ${web3.utils.fromWei(
                voterAllocation
            )} VOTE tokens to voter: ${voter}`
        );
    }

    const treasuryBalance = await voteToken.balanceOf(treasury.address);
    console.log(
        `Treasury Balance: ${web3.utils.fromWei(treasuryBalance, "mwei")} BRZ`
    );

    console.log("Deployment complete!");
};
