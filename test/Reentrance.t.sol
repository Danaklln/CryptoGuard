// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/contracts/reentrance/contract-1.sol";
import "../src/contracts/reentrance/attacker.sol";

contract ReentranceTest is Test {
    Reentrance bank;
    Attacker   attacker;

    address victim1 = address(0x1);
    address victim2 = address(0x2);
    address hacker   = address(0x3);

    function setUp() public {
        bank = new Reentrance();

        vm.deal(victim1, 5 ether);
        vm.prank(victim1);
        bank.deposit{value: 5 ether}();

        vm.deal(victim2, 5 ether);
        vm.prank(victim2);
        bank.deposit{value: 5 ether}();
    }

    function test_drain() public {
        assertEq(address(bank).balance, 10 ether);
        console.log("Bank before attack:", address(bank).balance);
        console.log("Attacker before attack:", address(attacker).balance);

        vm.deal(hacker, 1 ether);
        vm.prank(hacker);
        attacker = new Attacker(address(bank));

        vm.prank(hacker);
        attacker.attack{value: 1 ether}();

        assertEq(address(bank).balance, 0);
        assertEq(address(attacker).balance, 11 ether);

        console.log("Bank after attack:", address(bank).balance);
        console.log("Attacker after attack:", address(attacker).balance);
    }
}