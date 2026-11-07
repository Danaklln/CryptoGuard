// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Auction {

    address public highestBidder;
    uint256 public highestBid;

    function bid() external payable {
        require(msg.value > highestBid, "Bid not high enough");

        if (highestBidder != address(0)) {
            (bool success,) = payable(highestBidder).call{value: highestBid}("");
            require(success, "Refund failed");
        }
        highestBidder = msg.sender;
        highestBid = msg.value;
    }

}