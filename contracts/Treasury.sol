// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Import ReentrancyGuard
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable, ReentrancyGuard {
    IERC20 public immutable fundToken; // Token used for payments
    address public immutable serviceProvider;
    bool public isInitialPaymentReleased = false;
    bool public isFinalPaymentReleased = false;
    bool public serviceCompleted = false; // Changed to 'serviceCompleted'

    // Events
    event InitialPaymentReleased(address serviceProvider, uint256 amount);
    event FinalPaymentReleased(address serviceProvider, uint256 amount);
    event ServiceCompleted(address serviceProvider); // Event to track service completion

    constructor(IERC20 _fundToken, address _serviceProvider) {
        fundToken = _fundToken; // Set the funding token
        serviceProvider = _serviceProvider;
    }

    // Function to release the initial payment to the service provider
    function releaseInitialPayment(
        uint256 amount
    ) public onlyOwner nonReentrant {
        // Checks
        require(!isInitialPaymentReleased, "Initial payment already released");
        require(
            fundToken.balanceOf(address(this)) >= amount,
            "Insufficient funds"
        );

        // Effects
        isInitialPaymentReleased = true;
        emit InitialPaymentReleased(serviceProvider, amount); // Emit event after state change

        // Interactions
        fundToken.transfer(serviceProvider, amount);
    }

    // **Service Provider Confirms Completion**
    function confirmCompletion() external {
        require(
            msg.sender == serviceProvider,
            "Only service provider can confirm completion"
        );
        require(!serviceCompleted, "Service already confirmed");

        // Effects
        serviceCompleted = true; // Mark service as completed
        emit ServiceCompleted(serviceProvider); // Emit the event after state change
    }

    // Function to release the final payment to the service provider
    function releaseFinalPayment(uint256 amount) public onlyOwner nonReentrant {
        // Checks
        require(
            isInitialPaymentReleased,
            "Initial payment must be released first"
        );
        require(!isFinalPaymentReleased, "Final payment already released");
        require(serviceCompleted, "Service not completed");
        require(
            fundToken.balanceOf(address(this)) >= amount,
            "Insufficient funds"
        );

        // Effects
        isFinalPaymentReleased = true;
        emit FinalPaymentReleased(serviceProvider, amount); // Emit event after state change

        // Interactions
        fundToken.transfer(serviceProvider, amount);
    }
}
