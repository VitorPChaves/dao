// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract VoteToken is ERC20Votes {
    address public minter;

    constructor()
        ERC20("Bairro Vote Token", "VOTE")
        ERC20Permit("Bairro Vote Token")
    {
        // Assign the deployer as the initial minter
        minter = msg.sender;
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Optional: Mint initial supply to the deployer
    }

    // Function to set a new minter
    function setMinter(address _minter) external {
        require(msg.sender == minter, "Only minter can update");
        minter = _minter;
    }

    // Public mint function
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only minter can mint");
        _mint(to, amount);
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
