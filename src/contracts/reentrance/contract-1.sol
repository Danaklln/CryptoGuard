// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Reentrance {
    mapping(address => uint) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        (bool ok, ) = msg.sender.call{value: _amount}("");
        require(ok, "Transfer failed");
        unchecked {
        balances[msg.sender] -= _amount;   // sin protección de underflow, como en 2016
        }    
    }
}

/**
 * @title Reentrance: A contract vulnerable to reentrancy attacks.
 * Users can deposit and withdraw Ether.
 * @dev The withdraw function is vulnerable to reentrancy attacks because it updates the balance after sending Ether so, in that moment the attacker can reenter the contract and drain funds.

 */