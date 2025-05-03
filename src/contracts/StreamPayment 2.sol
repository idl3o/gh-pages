// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract StreamPayment {
    // Payment stream structure
    struct Stream {
        address sender;
        address recipient;
        uint256 rate;      // Rate per second in wei
        uint256 start;     // Start timestamp
        uint256 stop;      // Stop timestamp (0 if active)
        uint256 balance;   // Total balance deposited
        uint256 withdrawn; // Amount already withdrawn
    }
    
    // Storage
    mapping(bytes32 => Stream) public streams;
    
    // Events
    event StreamCreated(bytes32 streamId, address sender, address recipient, uint256 rate, uint256 balance);
    event StreamUpdated(bytes32 streamId, uint256 balance);
    event StreamStopped(bytes32 streamId, uint256 duration, uint256 paid);
    event Withdrawal(bytes32 streamId, address recipient, uint256 amount);
    
    // Create a new payment stream
    function createStream(address recipient, uint256 ratePerSecond) public payable returns (bytes32) {
        require(msg.value > 0, "Must deposit funds");
        require(recipient != address(0), "Invalid recipient");
        require(ratePerSecond > 0, "Rate must be positive");
        
        bytes32 streamId = keccak256(abi.encodePacked(msg.sender, recipient, block.timestamp));
        
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            rate: ratePerSecond,
            start: block.timestamp,
            stop: 0,
            balance: msg.value,
            withdrawn: 0
        });
        
        emit StreamCreated(streamId, msg.sender, recipient, ratePerSecond, msg.value);
        return streamId;
    }
    
    // Add funds to an existing stream
    function addFunds(bytes32 streamId) public payable {
        Stream storage stream = streams[streamId];
        require(stream.sender == msg.sender, "Not the stream sender");
        require(stream.stop == 0, "Stream already stopped");
        require(msg.value > 0, "Must add funds");
        
        stream.balance += msg.value;
        
        emit StreamUpdated(streamId, stream.balance);
    }
    
    // Stop a payment stream
    function stopStream(bytes32 streamId) public {
        Stream storage stream = streams[streamId];
        require(stream.sender == msg.sender, "Not the stream sender");
        require(stream.stop == 0, "Stream already stopped");
        
        stream.stop = block.timestamp;
        uint256 duration = stream.stop - stream.start;
        uint256 totalPaid = duration * stream.rate;
        
        // If there are unused funds, refund them to sender
        if (totalPaid < stream.balance) {
            uint256 refund = stream.balance - totalPaid;
            stream.balance = totalPaid;
            payable(msg.sender).transfer(refund);
        }
        
        emit StreamStopped(streamId, duration, stream.balance);
    }
    
    // Withdraw earned funds as recipient
    function withdraw(bytes32 streamId) public {
        Stream storage stream = streams[streamId];
        require(stream.recipient == msg.sender, "Not the recipient");
        
        uint256 duration;
        if (stream.stop == 0) {
            // Stream is still active
            duration = block.timestamp - stream.start;
        } else {
            // Stream has been stopped
            duration = stream.stop - stream.start;
        }
        
        uint256 earned = duration * stream.rate;
        uint256 available = earned - stream.withdrawn;
        
        // Cap available funds by total balance
        if (available > stream.balance) {
            available = stream.balance;
        }
        
        require(available > 0, "No funds available");
        
        stream.withdrawn += available;
        stream.balance -= available;
        
        payable(msg.sender).transfer(available);
        
        emit Withdrawal(streamId, msg.sender, available);
    }
    
    // Calculate currently streamable amount
    function getStreamableAmount(bytes32 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (stream.start == 0) return 0;
        
        uint256 duration;
        if (stream.stop == 0) {
            duration = block.timestamp - stream.start;
        } else {
            duration = stream.stop - stream.start;
        }
        
        uint256 earned = duration * stream.rate;
        uint256 available = earned - stream.withdrawn;
        
        return available > stream.balance ? stream.balance : available;
    }
}
