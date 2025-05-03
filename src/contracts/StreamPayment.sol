// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title StreamPayment
 * @dev Gas-optimized contract for streaming payments between addresses
 * @notice This contract implements real-time payment streaming with gas optimizations
 */
contract StreamPayment {
    // Payment stream structure - Packed for optimal storage
    struct Stream {
        address sender;           // 20 bytes
        address recipient;        // 20 bytes
        uint128 rate;             // 16 bytes (downsized from uint256)
        uint64 start;             // 8 bytes  (downsized from uint256)
        uint64 stop;              // 8 bytes  (downsized from uint256)
        uint128 balance;          // 16 bytes (downsized from uint256)
        uint128 withdrawn;        // 16 bytes (downsized from uint256)
    }

    // Storage
    mapping(bytes32 => Stream) public streams;

    // Events
    event StreamCreated(bytes32 indexed streamId, address indexed sender, address indexed recipient, uint128 rate, uint128 balance);
    event StreamUpdated(bytes32 indexed streamId, uint128 balance);
    event StreamStopped(bytes32 indexed streamId, uint64 duration, uint128 paid);
    event Withdrawal(bytes32 indexed streamId, address indexed recipient, uint128 amount);

    // Custom errors (saves gas compared to require statements with strings)
    error NoFunds();
    error InvalidRecipient();
    error InvalidRate();
    error NotStreamSender();
    error StreamAlreadyStopped();
    error NotStreamRecipient();
    error NoFundsAvailable();

    /**
     * @notice Create a new payment stream
     * @param recipient Address that will receive the streamed payments
     * @param ratePerSecond The rate at which funds are streamed per second
     * @return streamId Unique identifier for the created stream
     */
    function createStream(address recipient, uint128 ratePerSecond) public payable returns (bytes32) {
        // Use custom errors instead of require with string messages
        if (msg.value == 0) revert NoFunds();
        if (recipient == address(0)) revert InvalidRecipient();
        if (ratePerSecond == 0) revert InvalidRate();

        bytes32 streamId = keccak256(abi.encodePacked(msg.sender, recipient, block.timestamp));

        // Use memory for struct creation and then assign to storage (saves gas)
        Stream memory newStream = Stream({
            sender: msg.sender,
            recipient: recipient,
            rate: ratePerSecond,
            start: uint64(block.timestamp),
            stop: 0,
            balance: uint128(msg.value), // Safe cast as realistic values won't exceed uint128
            withdrawn: 0
        });

        streams[streamId] = newStream;

        emit StreamCreated(streamId, msg.sender, recipient, ratePerSecond, uint128(msg.value));
        return streamId;
    }

    /**
     * @notice Add funds to an existing stream
     * @param streamId Unique identifier of the stream
     */
    function addFunds(bytes32 streamId) public payable {
        // Direct access to storage variable
        Stream storage stream = streams[streamId];

        // Use custom errors
        if (stream.sender != msg.sender) revert NotStreamSender();
        if (stream.stop != 0) revert StreamAlreadyStopped();
        if (msg.value == 0) revert NoFunds();

        // Unchecked is safe here and saves gas as we're not expecting msg.value to cause an overflow
        unchecked {
            stream.balance += uint128(msg.value);
        }

        emit StreamUpdated(streamId, stream.balance);
    }

    /**
     * @notice Stop a payment stream
     * @param streamId Unique identifier of the stream to stop
     */
    function stopStream(bytes32 streamId) public {
        Stream storage stream = streams[streamId];

        if (stream.sender != msg.sender) revert NotStreamSender();
        if (stream.stop != 0) revert StreamAlreadyStopped();

        stream.stop = uint64(block.timestamp);

        // Use unchecked for gas savings on arithmetic that won't overflow
        uint64 duration;
        uint128 totalPaid;

        unchecked {
            duration = stream.stop - stream.start;
            totalPaid = duration * stream.rate;
        }

        // If there are unused funds, refund them to sender
        if (totalPaid < stream.balance) {
            uint128 refund = stream.balance - totalPaid;
            stream.balance = totalPaid;
            // Using low-level call instead of transfer to avoid potential issues
            (bool success, ) = stream.sender.call{value: refund}("");
            require(success, "Refund failed");
        }

        emit StreamStopped(streamId, duration, stream.balance);
    }

    /**
     * @notice Withdraw earned funds as recipient
     * @param streamId Unique identifier of the stream to withdraw from
     */
    function withdraw(bytes32 streamId) public {
        Stream storage stream = streams[streamId];

        if (stream.recipient != msg.sender) revert NotStreamRecipient();

        uint64 duration;
        if (stream.stop == 0) {
            // Stream is still active
            unchecked {
                duration = uint64(block.timestamp) - stream.start;
            }
        } else {
            // Stream has been stopped
            unchecked {
                duration = stream.stop - stream.start;
            }
        }

        uint128 earned;
        uint128 available;

        unchecked {
            earned = duration * stream.rate;
            available = earned - stream.withdrawn;
        }

        // Cap available funds by total balance
        if (available > stream.balance) {
            available = stream.balance;
        }

        if (available == 0) revert NoFundsAvailable();

        unchecked {
            stream.withdrawn += available;
            stream.balance -= available;
        }

        // Using low-level call instead of transfer for better gas efficiency
        (bool success, ) = msg.sender.call{value: available}("");
        require(success, "Transfer failed");

        emit Withdrawal(streamId, msg.sender, available);
    }

    /**
     * @notice Calculate currently streamable amount
     * @param streamId Unique identifier of the stream
     * @return The amount available for withdrawal
     */
    function getStreamableAmount(bytes32 streamId) public view returns (uint128) {
        Stream memory stream = streams[streamId];
        if (stream.start == 0) return 0;

        uint64 duration;
        if (stream.stop == 0) {
            unchecked {
                duration = uint64(block.timestamp) - stream.start;
            }
        } else {
            unchecked {
                duration = stream.stop - stream.start;
            }
        }

        uint128 earned;
        uint128 available;

        unchecked {
            earned = duration * stream.rate;
            available = earned - stream.withdrawn;
        }

        return available > stream.balance ? stream.balance : available;
    }
}
