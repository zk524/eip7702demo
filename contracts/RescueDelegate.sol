// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}
contract RescueDelegate {
    function rescueToken(address token, address to, uint256 amount) external {
        IERC20(token).transfer(to, amount);
    }
}
