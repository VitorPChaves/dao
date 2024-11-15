// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract VoteToken is ERC20Votes {
    constructor()
        ERC20("Bairro Vote Token", "VOTE")
        ERC20Permit("Bairro Vote Token")
    {
        // Mint an initial supply of VOTE tokens to the deployer’s address
        _mint(msg.sender, 1000000 * 10 ** decimals());
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
