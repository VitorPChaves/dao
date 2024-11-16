// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable {
    IERC20 public fundToken; // Token used for payments
    address public serviceProvider;
    bool public isInitialPaymentReleased = false;
    bool public isFinalPaymentReleased = false;
    bool public serviceConfirmed = false;

    // Events
    event InitialPaymentReleased(address serviceProvider, uint256 amount);
    event FinalPaymentReleased(address serviceProvider, uint256 amount);
    event ServiceConfirmed(); // Event to track service confirmation

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

        emit InitialPaymentReleased(serviceProvider, amount); // Emit event for transparency
    }

    function confirmServiceCompletion() external onlyOwner {
        require(!serviceConfirmed, "Service already confirmed");

        serviceConfirmed = true; // Mark service as confirmed
        emit ServiceConfirmed(); // Emit the event
    }

    function releaseFinalPayment(uint amount) public onlyOwner {
        require(
            isInitialPaymentReleased,
            "Initial payment must be released first"
        );
        require(!isFinalPaymentReleased, "Final payment already released");
        require(serviceConfirmed, "Service not confirmed");
        require(
            fundToken.balanceOf(address(this)) >= amount,
            "Insufficient funds"
        );

        fundToken.transfer(serviceProvider, amount);
        isFinalPaymentReleased = true;

        emit FinalPaymentReleased(serviceProvider, amount); // Emit event for transparency
    }
}
