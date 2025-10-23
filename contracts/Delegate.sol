// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract Delegate {
    address public target;
    function setTarget(address _target) external {
        target = _target;
    }
    fallback() external payable {
        if (target != address(0)) {
            (bool success, ) = target.call{value: msg.value}("");
            require(success, "Transfer failed");
        }
    }
    receive() external payable {
        if (target != address(0)) {
            (bool success, ) = target.call{value: msg.value}("");
            require(success, "Transfer failed");
        }
    }
}
