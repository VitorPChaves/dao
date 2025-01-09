// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./VoteToken.sol";

contract BairroGovernance {
    address public treasury;
    VoteToken public voteToken;
    uint256 public proposalCount;

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed
    }

    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        ProposalState state;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startBlock;
        uint256 endBlock;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;

    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(address voter, uint256 proposalId, bool support);

    event ProposalExecuted(uint256 proposalId);

    constructor(address _treasury, VoteToken _voteToken) {
        treasury = _treasury;
        voteToken = _voteToken;
    }

    // **Updated Propose Function**
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        require(
            targets.length == values.length &&
                targets.length == calldatas.length,
            "Mismatched proposal data lengths"
        );

        uint256 proposalId = proposalCount++;
        uint256 startBlock = block.number + 1; // Voting starts next block
        uint256 votingPeriod = 20; // Adjusted voting period for testing
        uint256 endBlock = startBlock + votingPeriod; // Voting ends after votingPeriod blocks

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            targets: targets,
            values: values,
            calldatas: calldatas,
            description: description,
            state: ProposalState.Pending, // Set initial state to Pending
            votesFor: 0,
            votesAgainst: 0,
            startBlock: startBlock,
            endBlock: endBlock
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            description,
            startBlock,
            endBlock
        );

        return proposalId;
    }

    // **Updated Vote Function**
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        ProposalState state = getProposalState(proposalId);
        require(
            state == ProposalState.Active,
            "Proposal is not active for voting"
        );
        require(!hasVoted[msg.sender][proposalId], "You have already voted");

        // Get the voter's token balance
        uint256 voterBalance = voteToken.balanceOf(msg.sender);
        require(voterBalance > 0, "No voting power (no VoteToken)");

        hasVoted[msg.sender][proposalId] = true;

        if (support) {
            proposal.votesFor += voterBalance;
        } else {
            proposal.votesAgainst += voterBalance;
        }

        emit VoteCast(msg.sender, proposalId, support);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        ProposalState state = getProposalState(proposalId);
        require(
            state == ProposalState.Succeeded,
            "Proposal is not in a succeeded state"
        );

        // Execute proposal actions
        proposal.state = ProposalState.Executed;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{
                value: proposal.values[i]
            }(proposal.calldatas[i]);
            require(success, "Transaction execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    // **Implemented getProposalState Function**
    function getProposalState(
        uint256 proposalId
    ) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (block.number < proposal.startBlock) {
            return ProposalState.Pending;
        } else if (
            block.number >= proposal.startBlock &&
            block.number <= proposal.endBlock
        ) {
            return ProposalState.Active;
        } else if (proposal.state == ProposalState.Executed) {
            return ProposalState.Executed;
        } else {
            // Voting period has ended
            if (!_isQuorumReached(proposalId)) {
                return ProposalState.Defeated;
            } else if (_isProposalApproved(proposalId)) {
                return ProposalState.Succeeded;
            } else {
                return ProposalState.Defeated;
            }
        }
    }

    // **Quorum Calculation Function**
    function _isQuorumReached(uint256 proposalId) internal view returns (bool) {
        uint256 totalSupply = voteToken.totalSupply();
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 quorum = (totalSupply * 50) / 100; // 50% quorum requirement

        return totalVotes >= quorum;
    }

    // **Proposal Approval Check Function**
    function _isProposalApproved(
        uint256 proposalId
    ) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.votesFor > proposal.votesAgainst;
    }
}
