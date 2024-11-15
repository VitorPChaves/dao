// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury {
    address public owner;
    IERC20 public fundToken; // Token contract (BRZ or DREX in the future)
    address public serviceProvider;
    bool public isInitialPaymentReleased = false;
    bool public isFinalPaymentReleased = false;

    constructor(IERC20 _fundToken, address _serviceProvider) {
        owner = msg.sender;
        fundToken = _fundToken; // Set BRZ as the initial fund token
        serviceProvider = _serviceProvider;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
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
