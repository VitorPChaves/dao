// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "./Treasury.sol";

contract BairroGovernance is Governor, GovernorVotes, GovernorCountingSimple {
    Treasury public treasury;

    constructor(
        ERC20Votes _voteToken,
        Treasury _treasury
    ) Governor("BairroGovernance") GovernorVotes(_voteToken) {
        treasury = _treasury;
    }

    function COUNTING_MODE()
        public
        pure
        override(IGovernor, GovernorCountingSimple)
        returns (string memory)
    {
        return "support=bravo&quorum=for,against";
    }

    function votingDelay() public pure override returns (uint256) {
        return 10; // Example: Voting begins 10 blocks after proposal creation
    }

    function votingPeriod() public pure override returns (uint256) {
        return 199152; // Approx. 1 month of voting period (in blocks)
    }

    function quorum(
        uint256 /* blockNumber */
    ) public pure override returns (uint256) {
        return 100; // Fixed quorum of 100 votes
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 10; // Minimum of 10 VOTE tokens required to create a proposal
    }
}
