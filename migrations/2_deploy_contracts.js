const VoteToken = artifacts.require("VoteToken");
const Treasury = artifacts.require("Treasury");
const BairroGovernance = artifacts.require("BairroGovernance");
const MockERC20 = artifacts.require("MockERC20"); // Only required for test networks

module.exports = async function (deployer, network, accounts) {
  // **Deploy VoteToken Contract**
  await deployer.deploy(VoteToken);
  const voteToken = await VoteToken.deployed();

  // **Assign Tokens to Voters**
  const minterAddress = accounts[0]; // Initial minter is the deployer
  const voterAddresses = accounts.slice(1, 7); // Assign tokens to accounts[1] to accounts[6]
  for (const voter of voterAddresses) {
    await voteToken.assignToken(voter, { from: minterAddress });
  }

  // **Determine Fund Token Address Based on Network**
  let fundTokenAddress;

  if (network === "mainnet" || network === "bsc" || network === "polygon") {
    // **Mainnet Deployment: Use Real BRZ Token Address**
    fundTokenAddress = "0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B"; // BRZ token address on Ethereum mainnet
    // **Note:** Verify the BRZ token address on the network you are deploying to.
  } else if (
    network === "development" ||
    network === "test" ||
    network === "ganache" ||
    network === "truffle"
  ) {
    // **Development or Test Network: Deploy MockERC20 Token**
    await deployer.deploy(
      MockERC20,
      "Mock BRZ Token",
      "MBRZ",
      18,
      web3.utils.toWei("1000000"), // Initial supply of 1,000,000 tokens
    );
    const mockERC20 = await MockERC20.deployed();
    fundTokenAddress = mockERC20.address;

    // **Fund the Treasury with Mock Tokens**
    // Transfer some mock tokens to the Treasury after deployment
  } else {
    // **Other Networks: Deploy MockERC20 Token**
    await deployer.deploy(
      MockERC20,
      "Mock BRZ Token",
      "MBRZ",
      18,
      web3.utils.toWei("1000000"),
    );
    const mockERC20 = await MockERC20.deployed();
    fundTokenAddress = mockERC20.address;
  }

  // **Specify Service Provider Address**
  const serviceProviderAddress = accounts[1]; // Replace with actual service provider address as needed

  // **Deploy Treasury Contract**
  await deployer.deploy(Treasury, fundTokenAddress, serviceProviderAddress);
  const treasury = await Treasury.deployed();

  // **Deploy BairroGovernance Contract**
  await deployer.deploy(BairroGovernance, treasury.address, voteToken.address);
  const bairroGovernance = await BairroGovernance.deployed();

  // **Transfer Ownership of Treasury to BairroGovernance**
  await treasury.transferOwnership(bairroGovernance.address);

  // **Optionally, Set BairroGovernance as the Minter of VoteToken**
  // If you want the governance contract to manage token minting/revoking
  // await voteToken.setMinter(bairroGovernance.address, { from: minterAddress });

  // **Fund the Treasury (Optional)**
  if (network !== "mainnet") {
    // For test networks, transfer some Mock BRZ tokens to the Treasury
    const mockERC20 = await MockERC20.deployed();
    await mockERC20.transfer(treasury.address, web3.utils.toWei("500000"), {
      from: accounts[0],
    });
  } else {
    // On mainnet, ensure the Treasury is funded with BRZ tokens manually
    console.log(
      "Please transfer BRZ tokens to the Treasury contract at:",
      treasury.address,
    );
  }

  // **Output Addresses for Reference**
  console.log("VoteToken deployed at:", voteToken.address);
  console.log("Treasury deployed at:", treasury.address);
  console.log("BairroGovernance deployed at:", bairroGovernance.address);
  if (network !== "mainnet") {
    console.log("Mock BRZ Token deployed at:", fundTokenAddress);
  }
};
