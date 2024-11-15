// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library GovernanceUtils {
    function calculateDynamicQuorum(
        uint256 blockNumber
    ) internal pure returns (uint256) {
        return 100 + (blockNumber / 10000);
    }
}
