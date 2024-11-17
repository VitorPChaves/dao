// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _customDecimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 customDecimals,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _customDecimals = customDecimals;
        _mint(msg.sender, initialSupply);
    }

    // Override the decimals function to return the custom decimals
    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }
}
