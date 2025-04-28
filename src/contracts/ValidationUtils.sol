// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ValidationUtils
 * @dev Library for input validation and sanitization
 */
library ValidationUtils {
    // Constants for validation limits
    uint256 private constant MAX_UINT64 = 2**64 - 1;
    uint256 private constant MAX_UINT128 = 2**128 - 1;
    uint256 private constant MAX_REASONABLE_AMOUNT = 10**27; // 1 billion tokens with 18 decimals
    uint256 private constant MAX_FEE_BPS = 5000; // 50% max fee
    uint256 private constant MAX_ARRAY_LENGTH = 100; // Reasonable limit for arrays to prevent DOS
    uint256 private constant MAX_TIMESTAMP_FUTURE = 10 * 365 days; // Max 10 years in future

    /**
     * @dev Validates address is not zero address
     * @param addr Address to validate
     * @return True if the address is valid
     */
    function isValidAddress(address addr) internal pure returns (bool) {
        return addr != address(0);
    }

    /**
     * @dev Ensures address is not zero address
     * @param addr Address to validate
     */
    function requireValidAddress(address addr) internal pure {
        require(addr != address(0), "Zero address not allowed");
    }

    /**
     * @dev Validates amount is within a reasonable range
     * @param amount Amount to validate
     * @param maxAmount Maximum allowed amount (defaults to MAX_REASONABLE_AMOUNT)
     * @return True if the amount is valid
     */
    function isValidAmount(uint256 amount, uint256 maxAmount) internal pure returns (bool) {
        if (maxAmount == 0) maxAmount = MAX_REASONABLE_AMOUNT;
        return amount > 0 && amount <= maxAmount;
    }

    /**
     * @dev Ensures amount is within a reasonable range
     * @param amount Amount to validate
     * @param maxAmount Maximum allowed amount (defaults to MAX_REASONABLE_AMOUNT)
     */
    function requireValidAmount(uint256 amount, uint256 maxAmount) internal pure {
        if (maxAmount == 0) maxAmount = MAX_REASONABLE_AMOUNT;
        require(amount > 0, "Amount must be positive");
        require(amount <= maxAmount, "Amount exceeds maximum allowed");
    }

    /**
     * @dev Validates fee percentage in basis points
     * @param feeBps Fee in basis points (1 basis point = 0.01%)
     * @param maxFeeBps Maximum allowed fee in basis points
     * @return True if the fee is valid
     */
    function isValidFee(uint256 feeBps, uint256 maxFeeBps) internal pure returns (bool) {
        if (maxFeeBps == 0) maxFeeBps = MAX_FEE_BPS;
        return feeBps <= maxFeeBps;
    }

    /**
     * @dev Ensures fee is valid
     * @param feeBps Fee in basis points
     * @param maxFeeBps Maximum allowed fee in basis points
     */
    function requireValidFee(uint256 feeBps, uint256 maxFeeBps) internal pure {
        if (maxFeeBps == 0) maxFeeBps = MAX_FEE_BPS;
        require(feeBps <= maxFeeBps, "Fee exceeds maximum allowed");
    }

    /**
     * @dev Validates array length
     * @param length Array length to validate
     * @param maxLength Maximum allowed length
     * @return True if the length is valid
     */
    function isValidArrayLength(uint256 length, uint256 maxLength) internal pure returns (bool) {
        if (maxLength == 0) maxLength = MAX_ARRAY_LENGTH;
        return length > 0 && length <= maxLength;
    }

    /**
     * @dev Ensures array length is valid
     * @param length Array length to validate
     * @param maxLength Maximum allowed length
     */
    function requireValidArrayLength(uint256 length, uint256 maxLength) internal pure {
        if (maxLength == 0) maxLength = MAX_ARRAY_LENGTH;
        require(length > 0, "Array cannot be empty");
        require(length <= maxLength, "Array length exceeds maximum");
    }

    /**
     * @dev Validates timestamp is within a reasonable range
     * @param timestamp Timestamp to validate
     * @param minTimestamp Minimum valid timestamp
     * @param maxTimestamp Maximum valid timestamp
     * @return True if the timestamp is valid
     */
    function isValidTimestamp(
        uint256 timestamp,
        uint256 minTimestamp,
        uint256 maxTimestamp
    ) internal view returns (bool) {
        if (minTimestamp == 0) minTimestamp = block.timestamp;
        if (maxTimestamp == 0) maxTimestamp = block.timestamp + MAX_TIMESTAMP_FUTURE;
        return timestamp >= minTimestamp && timestamp <= maxTimestamp;
    }

    /**
     * @dev Ensures timestamp is valid
     * @param timestamp Timestamp to validate
     * @param minTimestamp Minimum valid timestamp
     * @param maxTimestamp Maximum valid timestamp
     */
    function requireValidTimestamp(
        uint256 timestamp,
        uint256 minTimestamp,
        uint256 maxTimestamp
    ) internal view {
        if (minTimestamp == 0) minTimestamp = block.timestamp;
        if (maxTimestamp == 0) maxTimestamp = block.timestamp + MAX_TIMESTAMP_FUTURE;
        require(timestamp >= minTimestamp, "Timestamp too early");
        require(timestamp <= maxTimestamp, "Timestamp too far in future");
    }

    /**
     * @dev Validates string is not empty and within limits
     * @param str String to validate
     * @param maxLength Maximum allowed length
     * @return True if the string is valid
     */
    function isValidString(string memory str, uint256 maxLength) internal pure returns (bool) {
        return bytes(str).length > 0 && bytes(str).length <= maxLength;
    }

    /**
     * @dev Ensures string is valid
     * @param str String to validate
     * @param maxLength Maximum allowed length
     */
    function requireValidString(string memory str, uint256 maxLength) internal pure {
        require(bytes(str).length > 0, "String cannot be empty");
        require(bytes(str).length <= maxLength, "String too long");
    }

    /**
     * @dev Validates value can be safely downcast to uint64
     * @param value Value to validate
     * @return True if the value is valid
     */
    function isValidUint64(uint256 value) internal pure returns (bool) {
        return value <= MAX_UINT64;
    }

    /**
     * @dev Ensures value can be safely downcast to uint64
     * @param value Value to validate
     */
    function requireValidUint64(uint256 value) internal pure {
        require(value <= MAX_UINT64, "Value exceeds uint64 maximum");
    }

    /**
     * @dev Validates value can be safely downcast to uint128
     * @param value Value to validate
     * @return True if the value is valid
     */
    function isValidUint128(uint256 value) internal pure returns (bool) {
        return value <= MAX_UINT128;
    }

    /**
     * @dev Ensures value can be safely downcast to uint128
     * @param value Value to validate
     */
    function requireValidUint128(uint256 value) internal pure {
        require(value <= MAX_UINT128, "Value exceeds uint128 maximum");
    }
}
