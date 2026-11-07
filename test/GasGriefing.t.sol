// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "src/contracts/gas_griefing/wallet.sol";
import "src/contracts/gas_griefing/attacker.sol";
import "forge-std/Test.sol";


contract GasGriefingTest is Test {
    Auction auction;
    Attacker attacker;
    address bidder;


    function setUp() public {
        auction = new Auction();
        attacker = new Attacker();
        bidder = address(0x01);

        vm.deal(address(this), 10 ether);
        vm.deal(bidder, 10 ether);
    }

    function testGasGriefing() public {

        attacker.attack{value: 2 ether}(payable(address(auction)));

        assertEq(auction.highestBid(), 2 ether);
        assertEq(auction.highestBidder(), address(attacker));

        vm.prank(bidder);

        vm.expectRevert(
            abi.encodeWithSignature("Error(string)", "Refund failed")
        );

        auction.bid{value: 3 ether}();
        assertEq(auction.highestBid(), 2 ether);
        assertEq(auction.highestBidder(), address(attacker));
    }
} 

    


