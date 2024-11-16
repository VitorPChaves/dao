// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "./Treasury.sol"; // Import the Treasury contract

contract BairroGovernance is Governor, GovernorVotes, GovernorCountingSimple {
    Treasury public treasury; // Reference to the Treasury contract

    constructor(
        ERC20Votes _voteToken,
        Treasury _treasury
    ) Governor("BairroGovernance") GovernorVotes(_voteToken) {
        treasury = _treasury; // Set the Treasury contract
    }

    // Override COUNTING_MODE to define how votes are counted
    function COUNTING_MODE()
        public
        pure
        override(IGovernor, GovernorCountingSimple)
        returns (string memory)
    {
        return "support=bravo&quorum=for,against";
    }

    // Define a voting delay (blocks before voting starts after a proposal is created)
    function votingDelay() public pure override returns (uint256) {
        return 1; // Example: Voting begins 1 block after proposal creation
    }

    // Define a voting period (duration of voting in blocks)
    function votingPeriod() public pure override returns (uint256) {
        return 200; // Example: Voting period lasts for 200 blocks
    }

    // Define the quorum required for proposals to pass
    function quorum(
        uint256 /* blockNumber */
    ) public pure override returns (uint256) {
        return 1; // Example: Fixed quorum of 1 VOTE token
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 1; // 1 VOTE token required to create a proposal
    }

    // Propose confirmation of service completion (Example: Step 1 of final payment process)
    function proposeServiceConfirmation(
        string memory description
    ) external returns (uint256) {
        address;
        targets[0] = address(treasury);

        uint256;
        values[0] = 0; // No ETH required

        bytes;
        calldatas[0] = abi.encodeWithSignature("confirmServiceCompletion()");

        return propose(targets, values, calldatas, description);
    }

    // Propose final payment release (Example: Step 2 of final payment process)
    function proposeFinalPayment(
        uint256 amount,
        string memory description
    ) external returns (uint256) {
        address;
        targets[0] = address(treasury);

        uint256;
        values[0] = 0; // No ETH required

        bytes;
        calldatas[0] = abi.encodeWithSignature(
            "releaseFinalPayment(uint256)",
            amount
        );

        return propose(targets, values, calldatas, description);
    }
}
