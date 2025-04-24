// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title StandardErrors
 * @dev Library for standardized error handling across contracts
 * Provides consistent error codes, messages, and logging
 */
library StandardErrors {
    // Error events provide off-chain visibility
    event ErrorOccurred(uint256 indexed errorCode, string errorMessage, address indexed from);
    event CriticalError(uint256 indexed errorCode, string errorMessage, address indexed from);

    // Error code ranges by category
    // 1000-1999: Access control errors
    // 2000-2999: Input validation errors
    // 3000-3999: State validation errors
    // 4000-4999: Arithmetic errors
    // 5000-5999: External call errors
    // 6000-6999: Timing and sequencing errors
    // 9000-9999: Critical system errors

    // Access control error codes
    uint256 private constant ERR_UNAUTHORIZED = 1001;
    uint256 private constant ERR_INVALID_SIGNER = 1002;
    uint256 private constant ERR_ACCESS_DENIED = 1003;
    uint256 private constant ERR_WRONG_ROLE = 1004;

    // Input validation error codes
    uint256 private constant ERR_INVALID_PARAMETER = 2001;
    uint256 private constant ERR_INVALID_ADDRESS = 2002;
    uint256 private constant ERR_INVALID_AMOUNT = 2003;
    uint256 private constant ERR_INVALID_LENGTH = 2004;
    uint256 private constant ERR_ZERO_ADDRESS = 2005;
    uint256 private constant ERR_ZERO_AMOUNT = 2006;
    uint256 private constant ERR_OUT_OF_BOUNDS = 2007;

    // State validation error codes
    uint256 private constant ERR_INVALID_STATE = 3001;
    uint256 private constant ERR_ALREADY_INITIALIZED = 3002;
    uint256 private constant ERR_NOT_INITIALIZED = 3003;
    uint256 private constant ERR_LOCKED = 3004;
    uint256 private constant ERR_NOT_FOUND = 3005;
    uint256 private constant ERR_ALREADY_EXISTS = 3006;

    // Arithmetic error codes
    uint256 private constant ERR_OVERFLOW = 4001;
    uint256 private constant ERR_UNDERFLOW = 4002;
    uint256 private constant ERR_DIVIDE_BY_ZERO = 4003;
    uint256 private constant ERR_PRECISION_LOSS = 4004;

    // External call error codes
    uint256 private constant ERR_EXTERNAL_CALL = 5001;
    uint256 private constant ERR_TRANSFER_FAILED = 5002;
    uint256 private constant ERR_ETH_TRANSFER_FAILED = 5003;
    uint256 private constant ERR_CONTRACT_CALL_FAILED = 5004;
    uint256 private constant ERR_MESSAGE_TOO_LONG = 5005;

    // Timing and sequencing error codes
    uint256 private constant ERR_EXPIRED = 6001;
    uint256 private constant ERR_TOO_EARLY = 6002;
    uint256 private constant ERR_WRONG_SEQUENCE = 6003;
    uint256 private constant ERR_DEADLINE_EXCEEDED = 6004;
    uint256 private constant ERR_RATE_LIMITED = 6005;

    // Critical system error codes
    uint256 private constant ERR_CRITICAL_SYSTEM = 9001;
    uint256 private constant ERR_CONTRACT_PAUSED = 9002;
    uint256 private constant ERR_EMERGENCY_SHUTDOWN = 9003;
    uint256 private constant ERR_SELF_DESTRUCT = 9004;
    uint256 private constant ERR_INVALID_IMPLEMENTATION = 9005;

    /**
     * @dev Access control error functions
     */
    function unauthorized(string memory details) internal {
        _throwError(ERR_UNAUTHORIZED, string(abi.encodePacked("Unauthorized: ", details)));
    }

    function invalidSigner(string memory details) internal {
        _throwError(ERR_INVALID_SIGNER, string(abi.encodePacked("Invalid signer: ", details)));
    }

    function accessDenied(string memory details) internal {
        _throwError(ERR_ACCESS_DENIED, string(abi.encodePacked("Access denied: ", details)));
    }

    function wrongRole(string memory details) internal {
        _throwError(ERR_WRONG_ROLE, string(abi.encodePacked("Wrong role: ", details)));
    }

    /**
     * @dev Input validation error functions
     */
    function invalidParameter(string memory details) internal {
        _throwError(ERR_INVALID_PARAMETER, string(abi.encodePacked("Invalid parameter: ", details)));
    }

    function invalidAddress(string memory details) internal {
        _throwError(ERR_INVALID_ADDRESS, string(abi.encodePacked("Invalid address: ", details)));
    }

    function invalidAmount(string memory details) internal {
        _throwError(ERR_INVALID_AMOUNT, string(abi.encodePacked("Invalid amount: ", details)));
    }

    function invalidLength(string memory details) internal {
        _throwError(ERR_INVALID_LENGTH, string(abi.encodePacked("Invalid length: ", details)));
    }

    function zeroAddress() internal {
        _throwError(ERR_ZERO_ADDRESS, "Zero address not allowed");
    }

    function zeroAmount() internal {
        _throwError(ERR_ZERO_AMOUNT, "Zero amount not allowed");
    }

    function outOfBounds(string memory details) internal {
        _throwError(ERR_OUT_OF_BOUNDS, string(abi.encodePacked("Out of bounds: ", details)));
    }

    /**
     * @dev State validation error functions
     */
    function invalidState(string memory details) internal {
        _throwError(ERR_INVALID_STATE, string(abi.encodePacked("Invalid state: ", details)));
    }

    function alreadyInitialized() internal {
        _throwError(ERR_ALREADY_INITIALIZED, "Already initialized");
    }

    function notInitialized() internal {
        _throwError(ERR_NOT_INITIALIZED, "Not initialized");
    }

    function locked() internal {
        _throwError(ERR_LOCKED, "Contract is locked");
    }

    function notFound(string memory details) internal {
        _throwError(ERR_NOT_FOUND, string(abi.encodePacked("Not found: ", details)));
    }

    function alreadyExists(string memory details) internal {
        _throwError(ERR_ALREADY_EXISTS, string(abi.encodePacked("Already exists: ", details)));
    }

    /**
     * @dev Arithmetic error functions
     */
    function overflow(string memory details) internal {
        _throwError(ERR_OVERFLOW, string(abi.encodePacked("Overflow: ", details)));
    }

    function underflow(string memory details) internal {
        _throwError(ERR_UNDERFLOW, string(abi.encodePacked("Underflow: ", details)));
    }

    function divideByZero() internal {
        _throwError(ERR_DIVIDE_BY_ZERO, "Division by zero");
    }

    function precisionLoss(string memory details) internal {
        _throwError(ERR_PRECISION_LOSS, string(abi.encodePacked("Precision loss: ", details)));
    }

    /**
     * @dev External call error functions
     */
    function externalCallFailed(string memory details) internal {
        _throwError(ERR_EXTERNAL_CALL, string(abi.encodePacked("External call failed: ", details)));
    }

    function transferFailed(string memory details) internal {
        _throwError(ERR_TRANSFER_FAILED, string(abi.encodePacked("Transfer failed: ", details)));
    }

    function ethTransferFailed(string memory details) internal {
        _throwError(ERR_ETH_TRANSFER_FAILED, string(abi.encodePacked("ETH transfer failed: ", details)));
    }

    function contractCallFailed(string memory details) internal {
        _throwError(ERR_CONTRACT_CALL_FAILED, string(abi.encodePacked("Contract call failed: ", details)));
    }

    function messageTooLong() internal {
        _throwError(ERR_MESSAGE_TOO_LONG, "Message too long");
    }

    /**
     * @dev Timing and sequencing error functions
     */
    function expired(string memory details) internal {
        _throwError(ERR_EXPIRED, string(abi.encodePacked("Expired: ", details)));
    }

    function tooEarly(string memory details) internal {
        _throwError(ERR_TOO_EARLY, string(abi.encodePacked("Too early: ", details)));
    }

    function wrongSequence(string memory details) internal {
        _throwError(ERR_WRONG_SEQUENCE, string(abi.encodePacked("Wrong sequence: ", details)));
    }

    function deadlineExceeded(string memory details) internal {
        _throwError(ERR_DEADLINE_EXCEEDED, string(abi.encodePacked("Deadline exceeded: ", details)));
    }

    function rateLimited(string memory details) internal {
        _throwError(ERR_RATE_LIMITED, string(abi.encodePacked("Rate limited: ", details)));
    }

    /**
     * @dev Critical system error functions
     */
    function criticalSystem(string memory details) internal {
        _throwCriticalError(ERR_CRITICAL_SYSTEM, string(abi.encodePacked("Critical system error: ", details)));
    }

    function contractPaused() internal {
        _throwError(ERR_CONTRACT_PAUSED, "Contract is paused");
    }

    function emergencyShutdown() internal {
        _throwCriticalError(ERR_EMERGENCY_SHUTDOWN, "Emergency shutdown activated");
    }

    function selfDestruct() internal {
        _throwCriticalError(ERR_SELF_DESTRUCT, "Self destruct triggered");
    }

    function invalidImplementation() internal {
        _throwCriticalError(ERR_INVALID_IMPLEMENTATION, "Invalid implementation address");
    }

    /**
     * @dev Helper function to throw a regular error with logging
     * @param errorCode The error code
     * @param errorMessage The error message
     */
    function _throwError(uint256 errorCode, string memory errorMessage) private {
        emit ErrorOccurred(errorCode, errorMessage, msg.sender);
        revert(errorMessage);
    }

    /**
     * @dev Helper function to throw a critical error with logging
     * @param errorCode The error code
     * @param errorMessage The error message
     */
    function _throwCriticalError(uint256 errorCode, string memory errorMessage) private {
        emit CriticalError(errorCode, errorMessage, msg.sender);
        revert(errorMessage);
    }

    /**
     * @dev Get an error message for a specific error code
     * @param errorCode The error code
     * @return The error message
     */
    function getErrorMessage(uint256 errorCode) internal pure returns (string memory) {
        if (errorCode == ERR_UNAUTHORIZED) return "Unauthorized";
        if (errorCode == ERR_INVALID_SIGNER) return "Invalid signer";
        if (errorCode == ERR_ACCESS_DENIED) return "Access denied";
        if (errorCode == ERR_WRONG_ROLE) return "Wrong role";

        if (errorCode == ERR_INVALID_PARAMETER) return "Invalid parameter";
        if (errorCode == ERR_INVALID_ADDRESS) return "Invalid address";
        if (errorCode == ERR_INVALID_AMOUNT) return "Invalid amount";
        if (errorCode == ERR_INVALID_LENGTH) return "Invalid length";
        if (errorCode == ERR_ZERO_ADDRESS) return "Zero address not allowed";
        if (errorCode == ERR_ZERO_AMOUNT) return "Zero amount not allowed";
        if (errorCode == ERR_OUT_OF_BOUNDS) return "Out of bounds";

        if (errorCode == ERR_INVALID_STATE) return "Invalid state";
        if (errorCode == ERR_ALREADY_INITIALIZED) return "Already initialized";
        if (errorCode == ERR_NOT_INITIALIZED) return "Not initialized";
        if (errorCode == ERR_LOCKED) return "Contract is locked";
        if (errorCode == ERR_NOT_FOUND) return "Not found";
        if (errorCode == ERR_ALREADY_EXISTS) return "Already exists";

        if (errorCode == ERR_OVERFLOW) return "Overflow";
        if (errorCode == ERR_UNDERFLOW) return "Underflow";
        if (errorCode == ERR_DIVIDE_BY_ZERO) return "Division by zero";
        if (errorCode == ERR_PRECISION_LOSS) return "Precision loss";

        if (errorCode == ERR_EXTERNAL_CALL) return "External call failed";
        if (errorCode == ERR_TRANSFER_FAILED) return "Transfer failed";
        if (errorCode == ERR_ETH_TRANSFER_FAILED) return "ETH transfer failed";
        if (errorCode == ERR_CONTRACT_CALL_FAILED) return "Contract call failed";
        if (errorCode == ERR_MESSAGE_TOO_LONG) return "Message too long";

        if (errorCode == ERR_EXPIRED) return "Expired";
        if (errorCode == ERR_TOO_EARLY) return "Too early";
        if (errorCode == ERR_WRONG_SEQUENCE) return "Wrong sequence";
        if (errorCode == ERR_DEADLINE_EXCEEDED) return "Deadline exceeded";
        if (errorCode == ERR_RATE_LIMITED) return "Rate limited";

        if (errorCode == ERR_CRITICAL_SYSTEM) return "Critical system error";
        if (errorCode == ERR_CONTRACT_PAUSED) return "Contract is paused";
        if (errorCode == ERR_EMERGENCY_SHUTDOWN) return "Emergency shutdown activated";
        if (errorCode == ERR_SELF_DESTRUCT) return "Self destruct triggered";
        if (errorCode == ERR_INVALID_IMPLEMENTATION) return "Invalid implementation address";

        return "Unknown error";
    }
}
