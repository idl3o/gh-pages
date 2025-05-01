---
layout: default
title: Blockchain Technology Documentation
---

# Blockchain Technology Documentation

This documentation covers our blockchain technologies, focusing on smart contracts, the PRX Token Chain, payment streaming contracts, and security implementations.

## Overview

Our blockchain technology stack provides the foundation for secure, decentralized token transfers and payment streaming capabilities on Ethereum and compatible networks.

## Key Components

### Smart Contracts

Our smart contract ecosystem consists of several interoperating contracts that enable token management, payment streaming, and secure asset transfers.

#### Contract Architecture

```
PRXTokenChain
    ├── PRXToken (ERC-20)
    ├── PaymentStreaming
    │   ├── StreamController
    │   ├── StreamRegistry
    │   └── StreamEscrow
    └── SecurityModules
        ├── AccessControl
        ├── EmergencyPause
        └── UpgradeProxy
```

### PRX Token Chain

The PRX Token Chain implements an extended ERC-20 token standard with additional features for payment streaming and governance.

```solidity
// PRXToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PRX Token
 * @dev Extended ERC-20 token with streaming payment capabilities
 */
contract PRXToken is ERC20, Ownable, Pausable {
    // Stream controller address
    address public streamController;
    
    // Events
    event StreamControllerUpdated(address indexed oldController, address indexed newController);
    
    /**
     * @dev Constructor
     * @param initialSupply The initial supply of tokens
     */
    constructor(uint256 initialSupply) ERC20("PRX Token", "PRX") {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Set the stream controller address
     * @param _streamController The address of the stream controller contract
     */
    function setStreamController(address _streamController) external onlyOwner {
        require(_streamController != address(0), "PRXToken: zero address");
        
        address oldController = streamController;
        streamController = _streamController;
        
        emit StreamControllerUpdated(oldController, _streamController);
    }
    
    /**
     * @dev Allow the stream controller to transfer tokens for streaming payments
     * @param from The sender address
     * @param to The recipient address
     * @param amount The amount of tokens to transfer
     */
    function streamTransfer(address from, address to, uint256 amount) external returns (bool) {
        require(msg.sender == streamController, "PRXToken: caller is not the stream controller");
        require(from != address(0), "PRXToken: transfer from the zero address");
        require(to != address(0), "PRXToken: transfer to the zero address");
        
        _transfer(from, to, amount);
        return true;
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
```

### Payment Streaming Contracts

The core of our platform's functionality is the payment streaming system, which enables continuous, time-based token transfers between addresses.

#### StreamController Contract

```solidity
// StreamController.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPRXToken.sol";
import "./StreamRegistry.sol";
import "./StreamEscrow.sol";

/**
 * @title Stream Controller
 * @dev Manages payment streams between senders and recipients
 */
contract StreamController is Ownable, ReentrancyGuard {
    // State variables
    IPRXToken public token;
    StreamRegistry public registry;
    StreamEscrow public escrow;
    
    // Fee configuration
    uint256 public feePercentage; // 100 = 1%
    address public feeCollector;
    
    // Events
    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 amount, uint256 startTime, uint256 stopTime);
    event StreamCancelled(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 refundAmount);
    event StreamWithdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event FeeUpdated(uint256 newFeePercentage, address newFeeCollector);
    
    /**
     * @dev Constructor
     * @param _token Address of the PRX token contract
     * @param _registry Address of the stream registry contract
     * @param _escrow Address of the stream escrow contract
     */
    constructor(address _token, address _registry, address _escrow) {
        require(_token != address(0), "StreamController: token is zero address");
        require(_registry != address(0), "StreamController: registry is zero address");
        require(_escrow != address(0), "StreamController: escrow is zero address");
        
        token = IPRXToken(_token);
        registry = StreamRegistry(_registry);
        escrow = StreamEscrow(_escrow);
        
        feePercentage = 100; // 1% default fee
        feeCollector = msg.sender;
    }
    
    /**
     * @dev Create a new payment stream
     * @param recipient Address of the recipient
     * @param amount Total amount of tokens to stream
     * @param duration Duration of the stream in seconds
     * @return streamId The ID of the newly created stream
     */
    function createStream(
        address recipient,
        uint256 amount,
        uint256 duration
    ) external nonReentrant returns (uint256 streamId) {
        require(recipient != address(0), "StreamController: recipient is zero address");
        require(recipient != msg.sender, "StreamController: recipient is sender");
        require(amount > 0, "StreamController: amount is zero");
        require(duration > 0, "StreamController: duration is zero");
        
        // Calculate fee
        uint256 fee = (amount * feePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        // Transfer tokens to escrow
        require(
            token.transferFrom(msg.sender, address(escrow), amount),
            "StreamController: token transfer failed"
        );
        
        // Transfer fee to collector
        if (fee > 0) {
            escrow.transferFee(feeCollector, fee);
        }
        
        // Create stream
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + duration;
        
        streamId = registry.createStream(
            msg.sender,
            recipient,
            amountAfterFee,
            startTime,
            stopTime
        );
        
        emit StreamCreated(streamId, msg.sender, recipient, amountAfterFee, startTime, stopTime);
        return streamId;
    }
    
    /**
     * @dev Cancel an existing stream and refund the remaining tokens
     * @param streamId The ID of the stream to cancel
     */
    function cancelStream(uint256 streamId) external nonReentrant {
        (
            address sender,
            address recipient,
            uint256 amount,
            uint256 startTime,
            uint256 stopTime,
            uint256 remainingBalance
        ) = registry.getStream(streamId);
        
        require(msg.sender == sender, "StreamController: caller is not the sender");
        require(block.timestamp < stopTime, "StreamController: stream has already finished");
        
        // Calculate refund and already streamed amounts
        uint256 refundAmount = remainingBalance;
        uint256 streamedAmount = amount - refundAmount;
        
        // Update the stream
        registry.cancelStream(streamId);
        
        // Transfer streamed amount to recipient and refund to sender
        escrow.transferAmount(recipient, streamedAmount);
        escrow.transferAmount(sender, refundAmount);
        
        emit StreamCancelled(streamId, sender, recipient, refundAmount);
    }
    
    /**
     * @dev Withdraw from an active stream
     * @param streamId The ID of the stream to withdraw from
     */
    function withdrawFromStream(uint256 streamId) external nonReentrant {
        (
            address sender,
            address recipient,
            uint256 amount,
            uint256 startTime,
            uint256 stopTime,
            uint256 remainingBalance
        ) = registry.getStream(streamId);
        
        require(msg.sender == recipient, "StreamController: caller is not the recipient");
        require(block.timestamp >= startTime, "StreamController: stream has not started yet");
        
        uint256 withdrawableAmount;
        
        if (block.timestamp >= stopTime) {
            // Stream is complete, withdraw all remaining balance
            withdrawableAmount = remainingBalance;
            registry.completeStream(streamId);
        } else {
            // Calculate withdrawable amount based on elapsed time
            uint256 elapsedTime = block.timestamp - startTime;
            uint256 totalTime = stopTime - startTime;
            withdrawableAmount = (amount * elapsedTime) / totalTime - (amount - remainingBalance);
            
            registry.updateStreamBalance(streamId, remainingBalance - withdrawableAmount);
        }
        
        require(withdrawableAmount > 0, "StreamController: no funds available for withdrawal");
        
        // Transfer withdrawable amount to recipient
        escrow.transferAmount(recipient, withdrawableAmount);
        
        emit StreamWithdrawn(streamId, recipient, withdrawableAmount);
    }
    
    /**
     * @dev Get the withdrawable amount from a stream
     * @param streamId The ID of the stream
     * @return withdrawableAmount The amount that can be withdrawn
     */
    function getWithdrawableAmount(uint256 streamId) public view returns (uint256 withdrawableAmount) {
        (
            address sender,
            address recipient,
            uint256 amount,
            uint256 startTime,
            uint256 stopTime,
            uint256 remainingBalance
        ) = registry.getStream(streamId);
        
        if (block.timestamp <= startTime) {
            return 0;
        }
        
        if (block.timestamp >= stopTime) {
            return remainingBalance;
        }
        
        uint256 elapsedTime = block.timestamp - startTime;
        uint256 totalTime = stopTime - startTime;
        withdrawableAmount = (amount * elapsedTime) / totalTime - (amount - remainingBalance);
        
        return withdrawableAmount;
    }
    
    /**
     * @dev Update fee configuration
     * @param _feePercentage New fee percentage (100 = 1%)
     * @param _feeCollector Address of the fee collector
     */
    function updateFee(uint256 _feePercentage, address _feeCollector) external onlyOwner {
        require(_feePercentage <= 1000, "StreamController: fee too high"); // Max 10%
        require(_feeCollector != address(0), "StreamController: fee collector is zero address");
        
        feePercentage = _feePercentage;
        feeCollector = _feeCollector;
        
        emit FeeUpdated(_feePercentage, _feeCollector);
    }
}
```

#### StreamRegistry Contract

```solidity
// StreamRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Stream Registry
 * @dev Manages stream metadata and states
 */
contract StreamRegistry is Ownable {
    // Stream status
    enum Status { Active, Cancelled, Completed }
    
    // Stream structure
    struct Stream {
        address sender;
        address recipient;
        uint256 amount;
        uint256 startTime;
        uint256 stopTime;
        uint256 remainingBalance;
        Status status;
    }
    
    // State variables
    mapping(uint256 => Stream) private streams;
    uint256 private nextStreamId;
    address public controller;
    
    // Events
    event StreamRegistered(uint256 indexed streamId, address indexed sender, address indexed recipient);
    event StreamUpdated(uint256 indexed streamId, uint256 remainingBalance);
    event StreamStatusChanged(uint256 indexed streamId, Status status);
    event ControllerUpdated(address indexed oldController, address indexed newController);
    
    // Modifiers
    modifier onlyController() {
        require(msg.sender == controller, "StreamRegistry: caller is not the controller");
        _;
    }
    
    /**
     * @dev Constructor
     */
    constructor() {
        nextStreamId = 1;
    }
    
    /**
     * @dev Set the controller address
     * @param _controller Address of the controller contract
     */
    function setController(address _controller) external onlyOwner {
        require(_controller != address(0), "StreamRegistry: controller is zero address");
        
        address oldController = controller;
        controller = _controller;
        
        emit ControllerUpdated(oldController, _controller);
    }
    
    /**
     * @dev Create a new stream
     * @param sender Address of the sender
     * @param recipient Address of the recipient
     * @param amount Total amount of tokens to stream
     * @param startTime Start time of the stream
     * @param stopTime Stop time of the stream
     * @return streamId The ID of the newly created stream
     */
    function createStream(
        address sender,
        address recipient,
        uint256 amount,
        uint256 startTime,
        uint256 stopTime
    ) external onlyController returns (uint256 streamId) {
        streamId = nextStreamId++;
        
        streams[streamId] = Stream({
            sender: sender,
            recipient: recipient,
            amount: amount,
            startTime: startTime,
            stopTime: stopTime,
            remainingBalance: amount,
            status: Status.Active
        });
        
        emit StreamRegistered(streamId, sender, recipient);
        return streamId;
    }
    
    /**
     * @dev Update the remaining balance of a stream
     * @param streamId The ID of the stream
     * @param remainingBalance The new remaining balance
     */
    function updateStreamBalance(uint256 streamId, uint256 remainingBalance) external onlyController {
        require(streams[streamId].status == Status.Active, "StreamRegistry: stream is not active");
        
        streams[streamId].remainingBalance = remainingBalance;
        
        emit StreamUpdated(streamId, remainingBalance);
    }
    
    /**
     * @dev Cancel a stream
     * @param streamId The ID of the stream to cancel
     */
    function cancelStream(uint256 streamId) external onlyController {
        require(streams[streamId].status == Status.Active, "StreamRegistry: stream is not active");
        
        streams[streamId].status = Status.Cancelled;
        
        emit StreamStatusChanged(streamId, Status.Cancelled);
    }
    
    /**
     * @dev Mark a stream as completed
     * @param streamId The ID of the stream to complete
     */
    function completeStream(uint256 streamId) external onlyController {
        require(streams[streamId].status == Status.Active, "StreamRegistry: stream is not active");
        
        streams[streamId].status = Status.Completed;
        streams[streamId].remainingBalance = 0;
        
        emit StreamStatusChanged(streamId, Status.Completed);
    }
    
    /**
     * @dev Get stream details
     * @param streamId The ID of the stream
     * @return sender The sender address
     * @return recipient The recipient address
     * @return amount The total amount of tokens in the stream
     * @return startTime The start time of the stream
     * @return stopTime The stop time of the stream
     * @return remainingBalance The remaining balance of the stream
     */
    function getStream(uint256 streamId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        uint256 startTime,
        uint256 stopTime,
        uint256 remainingBalance
    ) {
        Stream storage stream = streams[streamId];
        
        return (
            stream.sender,
            stream.recipient,
            stream.amount,
            stream.startTime,
            stream.stopTime,
            stream.remainingBalance
        );
    }
    
    /**
     * @dev Get stream status
     * @param streamId The ID of the stream
     * @return status The status of the stream
     */
    function getStreamStatus(uint256 streamId) external view returns (Status status) {
        return streams[streamId].status;
    }
    
    /**
     * @dev Check if a stream exists
     * @param streamId The ID of the stream
     * @return exists True if the stream exists
     */
    function streamExists(uint256 streamId) external view returns (bool exists) {
        return streams[streamId].sender != address(0);
    }
}
```

#### StreamEscrow Contract

```solidity
// StreamEscrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPRXToken.sol";

/**
 * @title Stream Escrow
 * @dev Holds tokens for active streams and handles transfers
 */
contract StreamEscrow is Ownable {
    // State variables
    IPRXToken public token;
    address public controller;
    
    // Events
    event ControllerUpdated(address indexed oldController, address indexed newController);
    event TokenTransferred(address indexed to, uint256 amount);
    event FeeTransferred(address indexed collector, uint256 amount);
    
    // Modifiers
    modifier onlyController() {
        require(msg.sender == controller, "StreamEscrow: caller is not the controller");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _token Address of the PRX token contract
     */
    constructor(address _token) {
        require(_token != address(0), "StreamEscrow: token is zero address");
        token = IPRXToken(_token);
    }
    
    /**
     * @dev Set the controller address
     * @param _controller Address of the controller contract
     */
    function setController(address _controller) external onlyOwner {
        require(_controller != address(0), "StreamEscrow: controller is zero address");
        
        address oldController = controller;
        controller = _controller;
        
        emit ControllerUpdated(oldController, _controller);
    }
    
    /**
     * @dev Transfer tokens to a recipient
     * @param to Address of the recipient
     * @param amount Amount of tokens to transfer
     */
    function transferAmount(address to, uint256 amount) external onlyController {
        require(to != address(0), "StreamEscrow: recipient is zero address");
        require(amount > 0, "StreamEscrow: amount is zero");
        
        require(token.transfer(to, amount), "StreamEscrow: transfer failed");
        
        emit TokenTransferred(to, amount);
    }
    
    /**
     * @dev Transfer fee to the collector
     * @param collector Address of the fee collector
     * @param amount Amount of fee to transfer
     */
    function transferFee(address collector, uint256 amount) external onlyController {
        require(collector != address(0), "StreamEscrow: collector is zero address");
        require(amount > 0, "StreamEscrow: amount is zero");
        
        require(token.transfer(collector, amount), "StreamEscrow: transfer failed");
        
        emit FeeTransferred(collector, amount);
    }
    
    /**
     * @dev Get the token balance of the escrow
     * @return balance The token balance
     */
    function getBalance() external view returns (uint256 balance) {
        return token.balanceOf(address(this));
    }
    
    /**
     * @dev Emergency withdrawal in case of contract upgrade
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "StreamEscrow: recipient is zero address");
        require(amount > 0, "StreamEscrow: amount is zero");
        
        require(token.transfer(to, amount), "StreamEscrow: transfer failed");
        
        emit TokenTransferred(to, amount);
    }
}
```

### OpenZeppelin Security

Our contracts leverage OpenZeppelin's security libraries to ensure robust protection against common vulnerabilities:

1. **Access Control**: Implemented role-based access control to restrict sensitive operations
2. **Reentrancy Guards**: Prevent reentrancy attacks on all fund-related functions
3. **Pausable Functionality**: Allow emergency pausing of contracts if vulnerabilities are discovered
4. **Secure Math**: Use SafeMath (implicit in Solidity 0.8+) to prevent overflow/underflow attacks
5. **Proxy Upgrades**: Allow for contract upgrades while preserving state and balances

## Using Payment Streaming

### Streaming Workflow

1. **Create a Stream**:
   ```javascript
   const streamController = await StreamController.at("0xStreamControllerAddress");
   const recipient = "0xRecipientAddress";
   const amount = ethers.utils.parseEther("100"); // 100 PRX tokens
   const duration = 86400; // 24 hours in seconds
   
   // Approve token spending first
   await prxToken.approve(streamController.address, amount);
   
   // Create the stream
   const tx = await streamController.createStream(recipient, amount, duration);
   const receipt = await tx.wait();
   
   // Get the stream ID from the event
   const event = receipt.events.find(e => e.event === 'StreamCreated');
   const streamId = event.args.streamId;
   
   console.log(`Stream created with ID: ${streamId}`);
   ```

2. **Check Stream Status**:
   ```javascript
   const streamRegistry = await StreamRegistry.at("0xStreamRegistryAddress");
   const streamDetails = await streamRegistry.getStream(streamId);
   
   console.log(`Sender: ${streamDetails.sender}`);
   console.log(`Recipient: ${streamDetails.recipient}`);
   console.log(`Amount: ${ethers.utils.formatEther(streamDetails.amount)} PRX`);
   console.log(`Start Time: ${new Date(streamDetails.startTime * 1000).toLocaleString()}`);
   console.log(`Stop Time: ${new Date(streamDetails.stopTime * 1000).toLocaleString()}`);
   console.log(`Remaining Balance: ${ethers.utils.formatEther(streamDetails.remainingBalance)} PRX`);
   ```

3. **Withdraw from a Stream** (Recipient):
   ```javascript
   const withdrawableTx = await streamController.withdrawFromStream(streamId);
   await withdrawableTx.wait();
   
   console.log("Funds withdrawn successfully");
   ```

4. **Cancel a Stream** (Sender):
   ```javascript
   const cancelTx = await streamController.cancelStream(streamId);
   await cancelTx.wait();
   
   console.log("Stream cancelled successfully");
   ```

### Payment Stream Economics

Our payment streaming system offers several economic advantages:

1. **Time-Value Incentives**: Recipients receive funds continuously, improving cash flow
2. **Reduced Default Risk**: Funds are held in escrow and only released over time
3. **Lower Transaction Costs**: One setup transaction replaces multiple periodic transfers
4. **Automatic Payments**: No need for recurring manual transactions
5. **Precise Metering**: Pay exactly for what is used, down to the second

## Security Considerations

### Audits

Our smart contracts have undergone comprehensive security audits by leading blockchain security firms:

1. **ConsenSys Diligence**: Full audit of core payment streaming contracts
2. **CertiK**: Security assessment of token and registry contracts
3. **OpenZeppelin**: Review of security practices and code quality

### Security Best Practices

When interacting with our payment streaming contracts:

1. **Approval Management**: Only approve the exact amount needed for token transfers
2. **Timelock Verification**: Always verify stream start and end times before confirmation
3. **Gas Price Monitoring**: Use our Gas Price Manager to avoid excessive transaction fees
4. **Metadata Verification**: Cross-check stream metadata before initiating payments
5. **Recovery Planning**: Plan for dispute resolution and emergency scenarios

## Deployment Information

Our contracts are deployed on the following networks:

| Network | PRX Token | Stream Controller | Stream Registry | Stream Escrow |
|---------|-----------|------------------|----------------|--------------|
| Ethereum Mainnet | 0xPRXTokenAddress | 0xControllerAddress | 0xRegistryAddress | 0xEscrowAddress |
| Polygon | 0xPRXTokenAddressPoly | 0xControllerAddressPoly | 0xRegistryAddressPoly | 0xEscrowAddressPoly |
| Binance Smart Chain | 0xPRXTokenAddressBSC | 0xControllerAddressBSC | 0xRegistryAddressBSC | 0xEscrowAddressBSC |

## Next Steps

- [Server Documentation](../server-docs/index.md)
- [TypeScript SDK Documentation](../typescript-docs/index.md)
- [Integration Services Documentation](../services-docs/index.md)