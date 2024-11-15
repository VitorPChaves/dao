// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable {
    IERC20 public fundToken; // Token contract (e.g., BRZ or DREX in the future)
    address public serviceProvider;
    bool public isInitialPaymentReleased = false;
    bool public isFinalPaymentReleased = false;

    constructor(IERC20 _fundToken, address _serviceProvider) {
        fundToken = _fundToken; // Set the funding token
        serviceProvider = _serviceProvider;
    }

    function releaseInitialPayment(uint amount) public onlyOwner {
        require(!isInitialPaymentReleased, "Initial payment already released");
        require(
            fundToken.balanceOf(address(this)) >= amount,
            "Insufficient funds"
        );

        fundToken.transfer(serviceProvider, amount);
        isInitialPaymentReleased = true;
    }

    function releaseFinalPayment(uint amount) public onlyOwner {
        require(
            isInitialPaymentReleased,
            "Initial payment must be released first"
        );
        require(!isFinalPaymentReleased, "Final payment already released");
        require(
            fundToken.balanceOf(address(this)) >= amount,
            "Insufficient funds"
        );

        fundToken.transfer(serviceProvider, amount);
        isFinalPaymentReleased = true;
    }
}
