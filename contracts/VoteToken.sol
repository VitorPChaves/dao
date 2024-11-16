// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract VoteToken is ERC20Votes {
    address public minter; // The only entity allowed to mint tokens
    mapping(address => bool) public hasToken; // Track if an address already owns a token

    // Events
    event TokensAssigned(address indexed user);

    constructor()
        ERC20("Bairro Vote Token", "VOTE")
        ERC20Permit("Bairro Vote Token")
    {
        minter = msg.sender; // Assign deployer as the initial minter
    }

    // Function to assign a single token to a user
    function assignToken(address to) external {
        require(msg.sender == minter, "Only minter can assign tokens");
        require(!hasToken[to], "User already owns a token");

        _mint(to, 1 * 10 ** decimals()); // Mint exactly 1 token
        hasToken[to] = true; // Mark that the user owns a token
        emit TokensAssigned(to);
    }

    // Prevent transfers of tokens
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Allow minting and burning, but restrict transfers between users
        require(
            from == address(0) || to == address(0),
            "Transfers between users are not allowed"
        );
        super._beforeTokenTransfer(from, to, amount);
    }

    // Required overrides for ERC20Votes
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._burn(account, amount);
    }
}
