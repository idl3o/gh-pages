// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EnhancedReentrancyGuard
 * @dev Contract module that helps prevent reentrant calls and transaction ordering manipulations
 * This module is an enhanced version of OpenZeppelin's ReentrancyGuard with additional protections
 * against front-running, sandwich attacks, and other ordering-based issues.
 */
contract EnhancedReentrancyGuard {
    // Reentrancy guard state
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // Frontrunning protection
    mapping(address => uint256) private _lastOperationBlock;
    mapping(address => bytes32) private _pendingOperations;

    // Transaction ordering protection
    mapping(bytes32 => uint256) private _opTimestamps;
    uint256 private _minOperationDelay;
    uint256 private _maxOperationDelay;

    // Events for monitoring
    event OperationScheduled(address indexed user, bytes32 indexed opId, uint256 executionTime);
    event OperationExecuted(address indexed user, bytes32 indexed opId);
    event OperationCancelled(address indexed user, bytes32 indexed opId);

    /**
     * @dev Constructor that initializes the guard system
     * @param minDelay Minimum delay for operations (0 for no minimum)
     * @param maxDelay Maximum delay for operations (0 for no maximum)
     */
    constructor(uint256 minDelay, uint256 maxDelay) {
        _status = _NOT_ENTERED;
        _minOperationDelay = minDelay;
        _maxOperationDelay = maxDelay;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents multiple operations in the same block from the same address
     */
    modifier singleOperationPerBlock() {
        require(_lastOperationBlock[msg.sender] < block.number, "Only one operation per block");
        _lastOperationBlock[msg.sender] = block.number;
        _;
    }

    /**
     * @dev Ensures operations can only be executed by the original sender
     * @param operationId The unique identifier of the operation
     */
    modifier onlyOperationSender(bytes32 operationId) {
        require(_pendingOperations[msg.sender] == operationId, "Not operation sender");
        _;
    }

    /**
     * @dev Ensures operations are executed after the minimum delay
     * @param operationId The unique identifier of the operation
     */
    modifier afterMinDelay(bytes32 operationId) {
        uint256 opTime = _opTimestamps[operationId];
        require(opTime > 0, "Operation not scheduled");
        if (_minOperationDelay > 0) {
            require(block.timestamp >= opTime + _minOperationDelay, "Min delay not elapsed");
        }
        if (_maxOperationDelay > 0) {
            require(block.timestamp <= opTime + _maxOperationDelay, "Max delay exceeded");
        }
        _;
    }

    /**
     * @dev Schedule a time-sensitive operation
     * @param operationId A unique ID for the operation (usually a hash of parameters)
     * @return executionTime The timestamp when the operation can be executed
     */
    function _scheduleOperation(bytes32 operationId) internal returns (uint256 executionTime) {
        require(_opTimestamps[operationId] == 0, "Operation already scheduled");

        executionTime = block.timestamp + _minOperationDelay;
        _opTimestamps[operationId] = block.timestamp;
        _pendingOperations[msg.sender] = operationId;

        emit OperationScheduled(msg.sender, operationId, executionTime);
        return executionTime;
    }

    /**
     * @dev Complete a scheduled operation
     * @param operationId The ID of the operation being completed
     */
    function _completeOperation(bytes32 operationId) internal {
        delete _opTimestamps[operationId];
        delete _pendingOperations[msg.sender];

        emit OperationExecuted(msg.sender, operationId);
    }

    /**
     * @dev Cancel a scheduled operation
     * @param operationId The ID of the operation being cancelled
     */
    function _cancelOperation(bytes32 operationId) internal {
        require(_opTimestamps[operationId] > 0, "Operation not scheduled");
        require(_pendingOperations[msg.sender] == operationId, "Not operation sender");

        delete _opTimestamps[operationId];
        delete _pendingOperations[msg.sender];

        emit OperationCancelled(msg.sender, operationId);
    }

    /**
     * @dev Check if an operation is scheduled
     * @param operationId The ID of the operation
     * @return isScheduled True if the operation is scheduled
     */
    function isOperationScheduled(bytes32 operationId) public view returns (bool isScheduled) {
        return _opTimestamps[operationId] > 0;
    }

    /**
     * @dev Check if an operation is ready to execute
     * @param operationId The ID of the operation
     * @return isReady True if the operation is ready to execute
     */
    function isOperationReady(bytes32 operationId) public view returns (bool isReady) {
        uint256 opTime = _opTimestamps[operationId];
        if (opTime == 0) return false;

        bool minDelayPassed = _minOperationDelay == 0 || block.timestamp >= opTime + _minOperationDelay;
        bool maxDelayNotExceeded = _maxOperationDelay == 0 || block.timestamp <= opTime + _maxOperationDelay;

        return minDelayPassed && maxDelayNotExceeded;
    }

    /**
     * @dev Get the timestamp when an operation can be executed
     * @param operationId The ID of the operation
     * @return executionTime The timestamp when the operation can be executed (0 if not scheduled)
     */
    function getOperationExecutionTime(bytes32 operationId) public view returns (uint256 executionTime) {
        uint256 opTime = _opTimestamps[operationId];
        if (opTime == 0) return 0;
        return opTime + _minOperationDelay;
    }
}
