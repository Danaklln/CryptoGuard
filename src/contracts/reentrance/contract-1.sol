// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Reentrance {
    mapping(address => uint) private balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        (bool ok, ) = msg.sender.call{value: _amount}("");
        require(ok, "Transfer failed");
        unchecked{
        balances[msg.sender] -= _amount;  
        }
    }
}
