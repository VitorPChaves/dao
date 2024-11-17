// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VoteToken is ERC20Votes, Ownable {
    address public minter; // The entity allowed to mint and revoke tokens
    mapping(address => bool) public hasToken; // Track if an address owns a token

    // Events
    event TokensAssigned(address indexed user);
    event TokenRevoked(address indexed user);
    event MinterChanged(address indexed oldMinter, address indexed newMinter);

    constructor()
        ERC20("Bairro Vote Token", "VOTE")
        ERC20Permit("Bairro Vote Token")
    {
        minter = msg.sender; // Assign deployer as the initial minter
    }

    // Function to assign a single token to a user
    function assignToken(address to) external {
        require(msg.sender == minter, "Only minter can assign tokens");
        require(to != address(0), "Cannot assign to zero address");
        require(!hasToken[to], "User already owns a token");

        _mint(to, 1 * 10 ** decimals()); // Mint exactly 1 token
        hasToken[to] = true; // Mark that the user owns a token
        emit TokensAssigned(to);
    }

    // Function to revoke a token from a user
    function revokeToken(address from) external {
        require(msg.sender == minter, "Only minter can revoke tokens");
        require(hasToken[from], "User does not own a token");

        uint256 balance = balanceOf(from);
        _burn(from, balance); // Burn the user's token(s)
        hasToken[from] = false; // Update ownership status
        emit TokenRevoked(from);
    }

    // Function to change the minter
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Minter cannot be zero address");
        address oldMinter = minter;
        minter = newMinter;
        emit MinterChanged(oldMinter, newMinter);
    }

    // Prevent transfers of tokens between users
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Allow minting and burning but restrict transfers between users
        require(
            from == address(0) || to == address(0),
            "Transfers between users are not allowed"
        );
        super._beforeTokenTransfer(from, to, amount);
    }

    // Override functions to prevent unintended behavior
    function approve(address, uint256) public pure override returns (bool) {
        revert("Approve not allowed");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override returns (bool) {
        revert("Transfer not allowed");
    }

    function increaseAllowance(
        address,
        uint256
    ) public pure override returns (bool) {
        revert("Increase allowance not allowed");
    }

    function decreaseAllowance(
        address,
        uint256
    ) public pure override returns (bool) {
        revert("Decrease allowance not allowed");
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
