// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "./Treasury.sol";

contract BairroGovernance is Governor, GovernorVotes {
    Treasury public treasury;

    struct ProposalVote {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => ProposalVote) private proposalVotes;

    constructor(
        ERC20Votes _voteToken,
        Treasury _treasury
    ) Governor("BairroGovernance") GovernorVotes(_voteToken) {
        treasury = _treasury;
    }

    function COUNTING_MODE()
        public
        pure
        override(IGovernor)
        returns (string memory)
    {
        return "support=bravo&quorum=for,against";
    }

    function _quorumReached(
        uint256 proposalId
    ) internal view override(Governor) returns (bool) {
        ProposalVote storage proposal = proposalVotes[proposalId];
        uint256 forVotes = proposal.forVotes;
        return forVotes >= quorum(proposalSnapshot(proposalId));
    }

    function _voteSucceeded(
        uint256 proposalId
    ) internal view override(Governor) returns (bool) {
        ProposalVote storage proposal = proposalVotes[proposalId];
        uint256 forVotes = proposal.forVotes;
        uint256 againstVotes = proposal.againstVotes;
        return forVotes > againstVotes;
    }

    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal override(Governor) {
        ProposalVote storage proposal = proposalVotes[proposalId];
        require(
            !proposal.hasVoted[account],
            "BairroGovernance: vote already cast"
        );
        proposal.hasVoted[account] = true;

        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else if (support == 2) {
            proposal.abstainVotes += weight;
        } else {
            revert("BairroGovernance: invalid value for vote support");
        }
    }

    function hasVoted(
        uint256 proposalId,
        address account
    ) public view override(IGovernor) returns (bool) {
        ProposalVote storage proposal = proposalVotes[proposalId];
        return proposal.hasVoted[account];
    }

    function votingDelay() public pure override returns (uint256) {
        return 1; // Delay by 1 block after proposing before voting begins
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
