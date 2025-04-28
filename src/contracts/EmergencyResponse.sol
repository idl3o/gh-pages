// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EmergencyResponse
 * @dev Contract to handle emergency situations and asset recovery
 */
contract EmergencyResponse is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant EMERGENCY_ADMIN_ROLE = keccak256("EMERGENCY_ADMIN_ROLE");
    bytes32 public constant RECOVERY_ADMIN_ROLE = keccak256("RECOVERY_ADMIN_ROLE");

    // Timelock for recovery actions
    uint256 public constant RECOVERY_TIMELOCK = 24 hours;

    // Emergency states
    bool public emergencyPaused;

    // Multi-signature requirements
    uint256 public requiredEmergencySignatures;
    mapping(bytes32 => mapping(address => bool)) public emergencySignatures;
    mapping(bytes32 => uint256) public emergencySignatureCount;
    mapping(bytes32 => bool) public emergencyActionsExecuted;

    // Scheduled recovery actions
    struct RecoveryAction {
        address token;
        address destination;
        uint256 amount;
        uint256 scheduledTime;
        bool exists;
    }
    mapping(bytes32 => RecoveryAction) public scheduledRecoveries;

    // Events
    event EmergencyPauseChanged(bool paused);
    event RecoveryScheduled(bytes32 indexed actionId, address token, address destination, uint256 amount, uint256 scheduledTime);
    event RecoveryExecuted(bytes32 indexed actionId, address token, address destination, uint256 amount);
    event RecoveryCancelled(bytes32 indexed actionId);
    event EmergencySignatureAdded(bytes32 indexed actionId, address admin);
    event DirectEtherReceived(address sender, uint256 amount);

    /**
     * @dev Constructor that grants the deployer all admin roles
     * @param _emergencyAdmins Array of addresses that can trigger emergency procedures
     * @param _requiredSignatures Number of signatures required for emergency actions
     */
    constructor(
        address[] memory _emergencyAdmins,
        uint256 _requiredSignatures
    ) {
        require(_emergencyAdmins.length > 0, "Must have at least one emergency admin");
        require(_requiredSignatures > 0, "Required signatures must be > 0");
        require(_requiredSignatures <= _emergencyAdmins.length, "Required signatures exceeds admin count");

        // Set up roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECOVERY_ADMIN_ROLE, msg.sender);

        // Set up emergency admins
        for (uint256 i = 0; i < _emergencyAdmins.length; i++) {
            require(_emergencyAdmins[i] != address(0), "Admin cannot be zero address");
            _setupRole(EMERGENCY_ADMIN_ROLE, _emergencyAdmins[i]);
        }

        // Set multi-sig requirements
        requiredEmergencySignatures = _requiredSignatures;

        // Initialize state
        emergencyPaused = false;
    }

    /**
     * @dev Enable or disable emergency pause state
     * @param _isPaused New pause state
     */
    function setEmergencyPause(bool _isPaused) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        emergencyPaused = _isPaused;
        emit EmergencyPauseChanged(_isPaused);
    }

    /**
     * @dev Sign an emergency action as an admin
     * @param _actionId Unique identifier of the action
     */
    function signEmergencyAction(bytes32 _actionId) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        require(!emergencyActionsExecuted[_actionId], "Action already executed");
        require(!emergencySignatures[_actionId][msg.sender], "Already signed");

        emergencySignatures[_actionId][msg.sender] = true;
        emergencySignatureCount[_actionId] += 1;

        emit EmergencySignatureAdded(_actionId, msg.sender);
    }

    /**
     * @dev Schedule a token recovery with timelock
     * @param _token Address of the token to recover (zero address for ETH)
     * @param _destination Address to send the recovered funds
     * @param _amount Amount of tokens/ETH to recover
     * @return actionId Unique identifier of the scheduled recovery
     */
    function scheduleRecovery(
        address _token,
        address _destination,
        uint256 _amount
    ) external onlyRole(RECOVERY_ADMIN_ROLE) nonReentrant returns (bytes32) {
        require(_destination != address(0), "Destination cannot be zero address");
        require(_amount > 0, "Amount must be positive");

        bytes32 actionId = keccak256(
            abi.encodePacked("RECOVERY", _token, _destination, _amount, block.timestamp)
        );

        uint256 scheduledTime = block.timestamp + RECOVERY_TIMELOCK;

        scheduledRecoveries[actionId] = RecoveryAction({
            token: _token,
            destination: _destination,
            amount: _amount,
            scheduledTime: scheduledTime,
            exists: true
        });

        emit RecoveryScheduled(actionId, _token, _destination, _amount, scheduledTime);

        return actionId;
    }

    /**
     * @dev Execute a scheduled token recovery after timelock period
     * @param _actionId ID of the scheduled recovery
     */
    function executeRecovery(bytes32 _actionId) external onlyRole(RECOVERY_ADMIN_ROLE) nonReentrant {
        RecoveryAction storage action = scheduledRecoveries[_actionId];
        require(action.exists, "Recovery action doesn't exist");
        require(block.timestamp >= action.scheduledTime, "Timelock period not elapsed");

        // Check multi-sig requirement
        require(emergencySignatureCount[_actionId] >= requiredEmergencySignatures,
                "Insufficient signatures");

        // Execute recovery
        if (action.token == address(0)) {
            // ETH recovery
            (bool success, ) = action.destination.call{value: action.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 token recovery
            IERC20(action.token).safeTransfer(action.destination, action.amount);
        }

        // Mark as executed and clean up
        emergencyActionsExecuted[_actionId] = true;
        delete scheduledRecoveries[_actionId];

        emit RecoveryExecuted(_actionId, action.token, action.destination, action.amount);
    }

    /**
     * @dev Cancel a scheduled recovery
     * @param _actionId ID of the scheduled recovery
     */
    function cancelRecovery(bytes32 _actionId) external onlyRole(RECOVERY_ADMIN_ROLE) {
        require(scheduledRecoveries[_actionId].exists, "Recovery action doesn't exist");
        delete scheduledRecoveries[_actionId];
        emit RecoveryCancelled(_actionId);
    }

    /**
     * @dev Update the number of required signatures
     * @param _requiredSignatures New number of required signatures
     */
    function updateRequiredSignatures(uint256 _requiredSignatures) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_requiredSignatures > 0, "Required signatures must be > 0");
        require(_requiredSignatures <= getRoleMemberCount(EMERGENCY_ADMIN_ROLE),
                "Required signatures exceeds admin count");
        requiredEmergencySignatures = _requiredSignatures;
    }

    /**
     * @dev Recover ERC20 tokens accidentally sent to the contract
     * @param _token Address of the token contract
     * @param _to Address to send the tokens to
     * @param _amount Amount to recover
     */
    function recoverERC20(address _token, address _to, uint256 _amount) external onlyRole(RECOVERY_ADMIN_ROLE) {
        require(_token != address(0), "Invalid token address");
        require(_to != address(0), "Cannot send to zero address");
        IERC20(_token).safeTransfer(_to, _amount);
    }

    /**
     * @dev Allow the contract to receive ETH
     */
    receive() external payable {
        emit DirectEtherReceived(msg.sender, msg.value);
    }
}
