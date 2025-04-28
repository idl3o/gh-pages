# Smart Contract Security Best Practices Action List

## Access Control

- [ ] Implement proper role-based access control (RBAC) using OpenZeppelin's AccessControl

  ```solidity
  // Good example
  import "@openzeppelin/contracts/access/AccessControl.sol";

  contract SecureContract is AccessControl {
      bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
      bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

      constructor() {
          _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
          _setupRole(ADMIN_ROLE, msg.sender);
      }

      function adminFunction() external onlyRole(ADMIN_ROLE) {
          // Admin-only functionality
      }
  }
  ```

- [ ] Avoid using `tx.origin` for authorization (use `msg.sender` instead)

  ```solidity
  // Bad - vulnerable to phishing attacks
  function unsafeWithdraw() external {
      require(tx.origin == owner, "Not owner");
      // ...
  }

  // Good - uses direct caller
  function safeWithdraw() external {
      require(msg.sender == owner, "Not owner");
      // ...
  }
  ```

- [ ] Ensure critical functions have appropriate access restrictions
- [ ] Use multi-signature for high-value operations
- [ ] Verify function caller identity before executing privileged operations
- [ ] Implement timelocks for critical parameter changes

  ```solidity
  // Using a timelock for parameter changes
  uint256 public constant TIMELOCK_DURATION = 2 days;
  uint256 public proposedFee;
  uint256 public proposalTime;

  function proposeFeeChange(uint256 newFee) external onlyOwner {
      proposedFee = newFee;
      proposalTime = block.timestamp;
      emit FeeChangeProposed(newFee, proposalTime);
  }

  function executeeFeeChange() external onlyOwner {
      require(block.timestamp >= proposalTime + TIMELOCK_DURATION, "Timelock not expired");
      require(proposalTime != 0, "No proposal exists");

      platformFee = proposedFee;
      proposalTime = 0;
      emit FeeChanged(proposedFee);
  }
  ```

- [ ] Use modifiers consistently for access control

## Input Validation

- [ ] Validate all function parameters

  ```solidity
  function transfer(address to, uint256 amount) external {
      // Parameter validation
      require(to != address(0), "Cannot transfer to zero address");
      require(amount > 0, "Amount must be positive");
      require(amount <= balanceOf(msg.sender), "Insufficient balance");

      // Function logic
      // ...
  }
  ```

- [ ] Check for zero-address inputs in critical functions
  ```solidity
  function setAdmin(address newAdmin) external onlyOwner {
      require(newAdmin != address(0), "New admin cannot be zero address");
      admin = newAdmin;
  }
  ```
- [ ] Validate array lengths before processing

  ```solidity
  function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
      // Validate array inputs
      require(recipients.length > 0, "Empty recipients array");
      require(recipients.length == amounts.length, "Array length mismatch");
      require(recipients.length <= 100, "Batch too large"); // Prevent DOS attacks

      for (uint i = 0; i < recipients.length; i++) {
          // Additional validation for each element
          require(recipients[i] != address(0), "Invalid recipient");
          require(amounts[i] > 0, "Invalid amount");

          // Process transfer
          // ...
      }
  }
  ```

- [ ] Implement reasonable upper and lower bounds for numerical inputs

  ```solidity
  function setFee(uint256 newFeePercentage) external onlyAdmin {
      // Set reasonable boundaries
      require(newFeePercentage >= 100, "Fee too low"); // 1% minimum
      require(newFeePercentage <= 1000, "Fee too high"); // 10% maximum

      feePercentage = newFeePercentage;
  }
  ```

- [ ] Verify external contract addresses before interactions

  ```solidity
  function setExternalContract(address contractAddress) external onlyAdmin {
      require(contractAddress != address(0), "Invalid contract address");

      // Verify the contract has the expected interface
      try IExpectedInterface(contractAddress).requiredFunction() {
          externalContract = contractAddress;
      } catch {
          revert("Address does not implement required interface");
      }
  }
  ```

- [ ] Check string inputs for empty values and reasonable length
- [ ] Validate that arrays have matching lengths in batch operations

## Arithmetic Safety

- [ ] Use SafeMath for Solidity versions < 0.8.0

  ```solidity
  // For Solidity < 0.8.0
  import "@openzeppelin/contracts/math/SafeMath.sol";

  contract OlderContract {
      using SafeMath for uint256;

      function safeCalculation(uint256 a, uint256 b) external pure returns (uint256) {
          // Safe from overflow/underflow
          uint256 sum = a.add(b);
          uint256 product = a.mul(b);
          return product.div(sum);
      }
  }
  ```

- [ ] Add explicit overflow/underflow checks for Solidity ≥ 0.8.0

  ```solidity
  // For Solidity >= 0.8.0 (built-in overflow checks)
  function calculation(uint256 a, uint256 b) external pure returns (uint256) {
      // Automatically reverts on overflow
      uint256 sum = a + b;
      uint256 product = a * b;

      // Still need explicit check for division by zero
      require(sum > 0, "Division by zero");
      return product / sum;
  }

  // For unchecked math in 0.8.0+ (when optimization is needed)
  function optimizedCalculation(uint256 a, uint256 b) external pure returns (uint256) {
      unchecked {
          // No automatic overflow checks in this block - use only when safe
          return a + b;
      }
  }
  ```

- [ ] Avoid division before multiplication (to prevent precision loss)

  ```solidity
  // Bad - precision loss
  function badCalculation(uint256 a, uint256 b, uint256 c) external pure returns (uint256) {
      return (a / b) * c; // Precision loss if a < b
  }

  // Good - multiplication before division
  function goodCalculation(uint256 a, uint256 b, uint256 c) external pure returns (uint256) {
      return (a * c) / b; // Better precision maintained
  }
  ```

- [ ] Check for division by zero
  ```solidity
  function safeDivide(uint256 a, uint256 b) external pure returns (uint256) {
      require(b > 0, "Division by zero");
      return a / b;
  }
  ```
- [ ] Use appropriate data types (uint256, uint128, etc.) for the value ranges needed

  ```solidity
  // Good practice - using appropriate sized types
  contract EfficientStorage {
      // For flags that only need true/false
      bool public isActive;

      // For small numbers (< 256)
      uint8 public smallCounter;

      // For percentages (0-100)
      uint8 public percentage;

      // For medium-sized numbers
      uint64 public mediumValue;

      // For large numbers or currency amounts
      uint256 public largeAmount;
  }
  ```

- [ ] Set reasonable limits on calculations to prevent gas limits issues

  ```solidity
  function processBatch(uint256[] calldata data) external {
      // Prevent excessive gas costs
      require(data.length <= 100, "Batch too large");

      uint256 total = 0;
      for (uint i = 0; i < data.length; i++) {
          // Prevent overflow
          require(total + data[i] >= total, "Overflow detected");
          total += data[i];
      }
      // Process the total
  }
  ```

- [ ] Verify mathematical invariants with require statements

  ```solidity
  function swapTokens(uint256 amountIn, uint256 minAmountOut) external {
      // ... calculation logic ...
      uint256 amountOut = calculateSwapOutput(amountIn);

      // Verify mathematical invariant
      require(amountOut >= minAmountOut, "Slippage too high");

      // Execute swap
  }
  ```

## Reentrancy Protection

- [ ] Implement checks-effects-interactions pattern

  ```solidity
  // Bad - vulnerable to reentrancy
  function unsafeWithdraw(uint256 amount) external {
      if (amount <= balances[msg.sender]) {
          // Interaction before state change
          (bool success, ) = msg.sender.call{value: amount}("");

          // State change after interaction
          if (success) {
              balances[msg.sender] -= amount;
          }
      }
  }

  // Good - follows checks-effects-interactions pattern
  function safeWithdraw(uint256 amount) external {
      // Checks
      require(amount <= balances[msg.sender], "Insufficient balance");

      // Effects (state changes)
      balances[msg.sender] -= amount;

      // Interactions (external calls)
      (bool success, ) = msg.sender.call{value: amount}("");
      require(success, "Transfer failed");
  }
  ```

- [ ] Use ReentrancyGuard for functions involving external calls

  ```solidity
  import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

  contract SecureContract is ReentrancyGuard {
      function withdraw(uint256 amount) external nonReentrant {
          require(balances[msg.sender] >= amount, "Insufficient balance");
          balances[msg.sender] -= amount;
          (bool success, ) = msg.sender.call{value: amount}("");
          require(success, "Transfer failed");
      }
  }
  ```

- [ ] Complete all internal state changes before calling external contracts
- [ ] Be aware of cross-function reentrancy vulnerabilities

  ```solidity
  // Vulnerable to cross-function reentrancy
  mapping(address => uint256) private balances;

  function getBalance(address account) external view returns (uint256) {
      return balances[account];
  }

  function withdraw(uint256 amount) external nonReentrant {
      require(balances[msg.sender] >= amount, "Insufficient balance");
      // Even with nonReentrant, an attacker contract could call getBalance()
      // between these operations to get information
      (bool success, ) = msg.sender.call{value: amount}("");
      require(success, "Transfer failed");
      balances[msg.sender] -= amount;  // State change after interaction (wrong order)
  }
  ```

- [ ] Avoid calls to untrusted contracts
- [ ] Use pull-over-push pattern for payments

  ```solidity
  // Push pattern (less secure)
  function distributeRewards(address[] calldata recipients, uint256[] calldata amounts) external {
      for (uint i = 0; i < recipients.length; i++) {
          (bool success, ) = recipients[i].call{value: amounts[i]}("");
          require(success, "Transfer failed");
      }
  }

  // Pull pattern (more secure)
  mapping(address => uint256) public pendingRewards;

  function allocateRewards(address[] calldata recipients, uint256[] calldata amounts) external {
      for (uint i = 0; i < recipients.length; i++) {
          pendingRewards[recipients[i]] += amounts[i];
      }
  }

  function withdrawRewards() external {
      uint256 amount = pendingRewards[msg.sender];
      require(amount > 0, "No rewards to withdraw");

      // Update state before interaction
      pendingRewards[msg.sender] = 0;

      // Execute external call after state change
      (bool success, ) = msg.sender.call{value: amount}("");
      require(success, "Transfer failed");
  }
  ```

- [ ] Lock state during complex operations

## Gas Optimization

- [ ] Batch operations when possible to save gas

  ```solidity
  // Inefficient - multiple transactions
  function approveOne(address spender, uint256 tokenId) external {
      require(ownerOf(tokenId) == msg.sender, "Not owner");
      approve(spender, tokenId);
  }

  // Efficient - batch approval in one transaction
  function batchApprove(address spender, uint256[] calldata tokenIds) external {
      for (uint i = 0; i < tokenIds.length; i++) {
          require(ownerOf(tokenIds[i]) == msg.sender, "Not owner");
          approve(spender, tokenIds[i]);
      }
  }
  ```

- [ ] Use calldata instead of memory for function parameters when appropriate

  ```solidity
  // More gas - uses memory for arrays
  function processItems(uint256[] memory items) external {
      for (uint i = 0; i < items.length; i++) {
          // Process items[i]
      }
  }

  // Less gas - uses calldata for read-only arrays
  function processItems(uint256[] calldata items) external {
      for (uint i = 0; i < items.length; i++) {
          // Process items[i]
      }
  }
  ```

- [ ] Store only essential data on-chain

  ```solidity
  // Inefficient - stores full metadata on-chain
  function createItem(string memory name, string memory description, string memory fullMetadata) external {
      items[itemId] = Item({
          name: name,
          description: description,
          metadata: fullMetadata // Could be very large
      });
  }

  // Efficient - stores metadata hash on-chain, full data off-chain
  function createItem(string memory name, string memory description, bytes32 metadataHash) external {
      items[itemId] = Item({
          name: name,
          description: description,
          metadataHash: metadataHash // Just the hash, full data on IPFS
      });
  }
  ```

- [ ] Use appropriate data types (uint8, bool, etc.) and pack variables when possible

  ```solidity
  // Inefficient storage packing
  contract Unpacked {
      bool public isActive;     // Slot 0 (1 byte used)
      uint256 public amount;    // Slot 1 (32 bytes)
      bool public isFinalized;  // Slot 2 (1 byte used)
      address public owner;     // Slot 3 (20 bytes used)
  }

  // Efficient storage packing
  contract Packed {
      bool public isActive;     // Slot 0 (1 byte used)
      bool public isFinalized;  // Slot 0 (1 byte used)
      address public owner;     // Slot 0 (20 bytes used)
      uint256 public amount;    // Slot 1 (32 bytes)
  }
  ```

- [ ] Cache storage variables in memory for multiple uses within functions

  ```solidity
  // Inefficient - multiple storage reads
  function processStakes() external {
      for (uint i = 0; i < stakers.length; i++) {
          uint256 reward = stakes[stakers[i]] * rewardRate / 100;
          stakes[stakers[i]] = stakes[stakers[i]] + reward;
      }
  }

  // Efficient - cache storage variables
  function processStakes() external {
      uint256 rate = rewardRate; // Cache storage variable
      for (uint i = 0; i < stakers.length; i++) {
          address staker = stakers[i];
          uint256 stakerBalance = stakes[staker]; // Cache storage variable
          uint256 reward = stakerBalance * rate / 100;
          stakes[staker] = stakerBalance + reward;
      }
  }
  ```

- [ ] Avoid unnecessary contract calls

  ```solidity
  // Inefficient - repeated external calls
  function getTotalValue(address user) external view returns (uint256) {
      uint256 total = 0;
      for (uint i = 0; i < 5; i++) {
          total += token.balanceOf(user); // Repeated external call
      }
      return total;
  }

  // Efficient - single external call
  function getTotalValue(address user) external view returns (uint256) {
      uint256 balance = token.balanceOf(user); // Single external call
      return balance * 5;
  }
  ```

- [ ] Use efficient loops and exit early when conditions are met

  ```solidity
  // Inefficient loop
  function findElement(uint256[] storage array, uint256 value) internal view returns (bool) {
      bool found = false;
      for (uint i = 0; i < array.length; i++) {
          if (array[i] == value) {
              found = true;
          }
      }
      return found; // Processes the entire array even if found early
  }

  // Efficient loop with early exit
  function findElement(uint256[] storage array, uint256 value) internal view returns (bool) {
      for (uint i = 0; i < array.length; i++) {
          if (array[i] == value) {
              return true; // Exit as soon as found
          }
      }
      return false;
  }
  ```

## Proxy Patterns and Upgradability

- [ ] Understand the different proxy patterns and their tradeoffs

  ```solidity
  // 1. Transparent Proxy Pattern
  // Implementation contract
  contract ImplementationV1 {
      uint256 public value;

      function setValue(uint256 _value) external {
          value = _value;
      }
  }

  // Proxy contract using OpenZeppelin's TransparentUpgradeableProxy
  // import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

  // 2. UUPS (Universal Upgradeable Proxy Standard)
  // Implementation contract with upgrade logic
  import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

  contract UUPSImplementation is UUPSUpgradeable {
      uint256 public value;

      function initialize(uint256 _value) external initializer {
          value = _value;
      }

      function setValue(uint256 _value) external {
          value = _value;
      }

      function _authorizeUpgrade(address) internal override onlyOwner {}
  }

  // 3. Diamond Pattern (EIP-2535)
  // Allows multiple implementation contracts (facets)
  ```

- [ ] Be aware of storage collision issues in upgradeable contracts

  ```solidity
  // V1 Implementation
  contract StorageV1 {
      uint256 public value;      // Slot 0
      address public owner;      // Slot 1

      // Reserve storage for future upgrades
      uint256[48] private __gap; // Slots 2-49
  }

  // V2 Implementation - Safe
  contract StorageV2 {
      uint256 public value;      // Slot 0 (unchanged)
      address public owner;      // Slot 1 (unchanged)
      uint256 public newValue;   // Slot 2

      // Reduced gap to maintain total storage layout
      uint256[47] private __gap; // Slots 3-49
  }

  // V2 Implementation - UNSAFE (would cause storage collision)
  contract StorageV2Unsafe {
      address public owner;      // Slot 0 (COLLISION with value in V1!)
      uint256 public value;      // Slot 1 (COLLISION with owner in V1!)
      uint256 public newValue;   // Slot 2
  }
  ```

- [ ] Implement secure initialization patterns for upgradeable contracts

  ```solidity
  // Anti-pattern: using constructor for initialization
  contract UnsafeUpgradeableContract {
      uint256 public value;
      address public owner;

      // WRONG: Constructor code won't be executed in the proxy context
      constructor() {
          owner = msg.sender;
      }
  }

  // Safe pattern: using initializer function
  import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

  contract SafeUpgradeableContract is Initializable {
      uint256 public value;
      address public owner;

      // Correct: Use initializer function
      function initialize() public initializer {
          owner = msg.sender;
      }
  }
  ```

- [ ] Implement secure upgrade authorization mechanisms

  ```solidity
  // Basic authorization
  function _authorizeUpgrade(address) internal override onlyOwner {}

  // Advanced authorization with timelock
  contract TimelockUpgradeable is UUPSUpgradeable {
      address public pendingImplementation;
      uint256 public upgradeTimestamp;
      uint256 public constant UPGRADE_TIMELOCK = 2 days;

      function proposeUpgrade(address newImplementation) external onlyOwner {
          pendingImplementation = newImplementation;
          upgradeTimestamp = block.timestamp + UPGRADE_TIMELOCK;
          emit UpgradeProposed(newImplementation, upgradeTimestamp);
      }

      function _authorizeUpgrade(address newImplementation) internal override {
          require(msg.sender == owner(), "Not authorized");
          require(newImplementation == pendingImplementation, "Invalid implementation");
          require(block.timestamp >= upgradeTimestamp, "Timelock not expired");
      }
  }

  // Multi-signature authorization
  contract MultiSigUpgradeable is UUPSUpgradeable {
      address[] public admins;
      mapping(address => bool) public isAdmin;
      mapping(bytes32 => mapping(address => bool)) public approvals;
      uint256 public requiredApprovals;

      function approveUpgrade(address newImplementation) external {
          require(isAdmin[msg.sender], "Not admin");
          bytes32 upgradeHash = keccak256(abi.encodePacked(newImplementation));
          approvals[upgradeHash][msg.sender] = true;
      }

      function _authorizeUpgrade(address newImplementation) internal override {
          bytes32 upgradeHash = keccak256(abi.encodePacked(newImplementation));
          uint256 count = 0;
          for (uint i = 0; i < admins.length; i++) {
              if (approvals[upgradeHash][admins[i]]) {
                  count++;
              }
          }
          require(count >= requiredApprovals, "Insufficient approvals");
      }
  }
  ```

- [ ] Understand and avoid the delegatecall proxy selector clashing

  ```solidity
  // Potential selector clash issue
  contract AdminUpgradeable {
      address public admin;

      // Function selector: 0x8f283970 (simplified)
      function changeAdmin(address newAdmin) external {
          admin = newAdmin;
      }
  }

  contract TokenUpgradeable {
      mapping(address => uint256) public balances;

      // DANGER: Might have same selector as changeAdmin!
      // Hypothetical function with selector clash
      function transferFrom(address from, address to, uint256 amount) external {
          balances[from] -= amount;
          balances[to] += amount;
      }
  }

  // Solution: Use TransparentProxy pattern where admin functions
  // are handled separately, or use unstructured storage approach
  ```

- [ ] Implement secure fallback and receive functions for proxy contracts

  ```solidity
  contract SecureProxy {
      address public implementation;
      address public admin;

      // Forward all calls to implementation contract
      fallback() external payable {
          address _impl = implementation;
          require(_impl != address(0));

          assembly {
              // Copy calldata to memory
              calldatacopy(0, 0, calldatasize())

              // Forward call to implementation
              let result := delegatecall(gas(), _impl, 0, calldatasize(), 0, 0)

              // Copy the returned data
              returndatacopy(0, 0, returndatasize())

              switch result
              case 0 { revert(0, returndatasize()) }
              default { return(0, returndatasize()) }
          }
      }

      // Allow contract to receive ETH
      receive() external payable {}
  }
  ```

- [ ] Track implementation versions and emit upgrade events

  ```solidity
  contract VersionedUpgradeable is UUPSUpgradeable {
      string public version;

      event Upgraded(address indexed implementation, string version);

      function setVersion(string memory newVersion) internal {
          version = newVersion;
      }

      function upgradeToAndCall(
          address newImplementation,
          bytes memory data,
          string memory newVersion
      ) external onlyOwner {
          _upgradeToAndCallUUPS(newImplementation, data, true);
          emit Upgraded(newImplementation, newVersion);
      }
  }
  ```

- [ ] Test all upgrade paths thoroughly before production deployment

  ```javascript
  // Example upgrade test using Hardhat
  const { expect } = require('chai');
  const { ethers, upgrades } = require('hardhat');

  describe('Contract Upgrades', function () {
    it('Should upgrade correctly and preserve state', async function () {
      const [owner, user] = await ethers.getSigners();

      // Deploy V1
      const ImplementationV1 = await ethers.getContractFactory('ImplementationV1');
      const proxy = await upgrades.deployProxy(ImplementationV1, [42], {
        initializer: 'initialize'
      });
      await proxy.deployed();

      // Interact with V1
      await proxy.setValue(100);
      expect(await proxy.value()).to.equal(100);

      // Upgrade to V2
      const ImplementationV2 = await ethers.getContractFactory('ImplementationV2');
      const upgradedProxy = await upgrades.upgradeProxy(proxy.address, ImplementationV2);

      // Verify state is preserved
      expect(await upgradedProxy.value()).to.equal(100);

      // Use new V2 functionality
      await upgradedProxy.setValueDoubled(50);
      expect(await upgradedProxy.value()).to.equal(100);
      expect(await upgradedProxy.valueDoubled()).to.equal(100);
    });
  });
  ```

- [ ] Consider immutable vs. upgradeable components

  ```solidity
  // Split functionality between immutable and upgradeable contracts

  // Immutable core logic
  contract TokenCore {
      mapping(address => uint256) public balances;

      function _transfer(address from, address to, uint256 amount) internal {
          require(balances[from] >= amount, "Insufficient balance");
          balances[from] -= amount;
          balances[to] += amount;
      }
  }

  // Upgradeable policy layer
  contract TokenPolicy is Initializable {
      TokenCore public immutable core;
      mapping(address => bool) public frozen;

      constructor(address _core) {
          core = TokenCore(_core);
      }

      function initialize() external initializer {
          // initialization logic
      }

      function transfer(address to, uint256 amount) external {
          require(!frozen[msg.sender], "Account frozen");
          core._transfer(msg.sender, to, amount);
      }

      // This policy can be upgraded while core remains immutable
  }
  ```

- [ ] Implement emergency pause mechanisms for upgradeable contracts

  ```solidity
  import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

  contract PausableToken is PausableUpgradeable, UUPSUpgradeable {
      function initialize() public initializer {
          __Pausable_init();
          __UUPSUpgradeable_init();
      }

      function transfer(address to, uint256 amount) external whenNotPaused {
          // Transfer logic
      }

      function pause() external onlyOwner {
          _pause();
      }

      function unpause() external onlyOwner {
          _unpause();
      }

      function _authorizeUpgrade(address) internal override onlyOwner {}
  }
  ```

- [ ] Document all storage layouts and upgrade procedures
  ```solidity
  /**
   * @title TokenV1
   * @dev Storage layout:
   * - mapping(address => uint256) public balances;
   * - address public owner;
   * - uint256 public totalSupply;
   * - uint256[47] private __gap;
   * 
   * @notice Upgrade Procedure:
   * 1. Deploy new implementation
   * 2. Call upgradeTo(newImplementation)
   * 3. Verify state preservation
   * /
  contract TokenV1 {
      // Implementation
  }
  ```

## Cross-chain Security Considerations

- [ ] Implement secure bridge interaction patterns

  ```solidity
  // Bad practice - no validation of cross-chain messages
  function receiveFromBridge(bytes memory data) external {
      (address user, uint256 amount) = abi.decode(data, (address, uint256));
      balances[user] += amount;
  }

  // Good practice - verify bridge messages
  function receiveFromBridge(
      bytes memory data,
      bytes memory signature
  ) external {
      // Verify the bridge's signature
      require(verifyBridgeSignature(data, signature), "Invalid bridge signature");

      // Process only after verification
      (address user, uint256 amount) = abi.decode(data, (address, uint256));
      balances[user] += amount;
  }
  ```

- [ ] Use reliable oracles for cross-chain data verification

  ```solidity
  // Using Chainlink for cross-chain data verification
  import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

  contract CrossChainAwareDApp {
      AggregatorV3Interface internal dataFeed;

      constructor(address _oracleAddress) {
          dataFeed = AggregatorV3Interface(_oracleAddress);
      }

      function getLatestData() public view returns (int) {
          // Get verified data from another chain via oracle
          (, int price, , uint timeStamp, ) = dataFeed.latestRoundData();
          require(timeStamp > 0, "Round not complete");
          return price;
      }
  }
  ```

- [ ] Implement replay protection for cross-chain transactions

  ```solidity
  contract ReplayProtectedBridge {
      // Map to track processed message IDs
      mapping(bytes32 => bool) public processedMessages;

      function processMessage(bytes32 messageId, bytes memory data, bytes memory proof) external {
          // Check that this message hasn't been processed before
          require(!processedMessages[messageId], "Message already processed");

          // Verify the message is valid
          require(verifyMessageProof(messageId, data, proof), "Invalid message proof");

          // Mark message as processed before execution to prevent reentrancy
          processedMessages[messageId] = true;

          // Execute the message logic
          _executeMessage(data);
      }

      function _executeMessage(bytes memory data) internal {
          // Message execution logic
      }
  }
  ```

- [ ] Handle different finality guarantees between chains

  ```solidity
  contract FinalityAwareBridge {
      // Different confirmation requirements per chain
      mapping(uint256 => uint256) public requiredConfirmations;

      constructor() {
          // Example: Ethereum mainnet needs more confirmations than L2s
          requiredConfirmations[1] = 12; // Ethereum Mainnet
          requiredConfirmations[10] = 32; // Optimism
          requiredConfirmations[42161] = 64; // Arbitrum
      }

      function processTransaction(
          uint256 sourceChainId,
          bytes32 txHash,
          uint256 confirmations
      ) external {
          // Ensure sufficient confirmations based on source chain
          require(
              confirmations >= requiredConfirmations[sourceChainId],
              "Insufficient confirmations"
          );

          // Process the cross-chain transaction
          // ...
      }
  }
  ```

- [ ] Implement safe asset transfer patterns across chains

  ```solidity
  // Lock-and-mint pattern for cross-chain transfers
  contract TokenBridge {
      mapping(address => uint256) public lockedTokens;

      // Lock tokens on the source chain
      function lockTokens(uint256 amount, address recipient, uint256 targetChain) external {
          // Transfer tokens from user to contract (lock)
          require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

          // Record the locked tokens
          lockedTokens[msg.sender] += amount;

          // Emit event for the target chain to mint tokens
          emit TokensLocked(msg.sender, recipient, amount, targetChain);
      }

      // Release tokens on the source chain if the bridging fails
      function unlockTokens(uint256 amount, bytes memory proof) external {
          // Verify the unlocking is authorized (e.g., timeout or failure proof)
          require(verifyUnlockProof(proof), "Invalid unlock proof");

          require(lockedTokens[msg.sender] >= amount, "Insufficient locked tokens");
          lockedTokens[msg.sender] -= amount;

          // Transfer tokens back to user
          require(token.transfer(msg.sender, amount), "Transfer failed");
      }
  }
  ```

- [ ] Account for different gas costs and models across chains

  ```solidity
  contract GasAwareCrossChainExecutor {
      // Gas limits for different destination chains
      mapping(uint256 => uint256) public gasLimits;

      constructor() {
          // Set different gas limits based on destination chain characteristics
          gasLimits[1] = 300000; // Ethereum Mainnet
          gasLimits[137] = 500000; // Polygon
          gasLimits[43114] = 200000; // Avalanche
      }

      function executeOnDestinationChain(
          uint256 targetChainId,
          address targetContract,
          bytes memory callData
      ) external payable {
          // Ensure enough gas is provided for the target chain
          require(
              gasleft() >= gasLimits[targetChainId],
              "Insufficient gas for cross-chain execution"
          );

          // Execute cross-chain transaction
          // ...
      }
  }
  ```

- [ ] Use timeouts and dispute resolution mechanisms for cross-chain operations

  ```solidity
  contract TimeoutEnabledBridge {
      struct CrossChainTransfer {
          address sender;
          address recipient;
          uint256 amount;
          uint256 deadline;
          bool executed;
          bool refunded;
      }

      mapping(bytes32 => CrossChainTransfer) public transfers;

      // Initiate a cross-chain transfer with timeout
      function initiateTransfer(address recipient, uint256 amount) external {
          bytes32 transferId = keccak256(abi.encodePacked(
              msg.sender, recipient, amount, block.timestamp
          ));

          transfers[transferId] = CrossChainTransfer({
              sender: msg.sender,
              recipient: recipient,
              amount: amount,
              deadline: block.timestamp + 24 hours, // 24-hour timeout
              executed: false,
              refunded: false
          });

          // Lock tokens from sender
          token.transferFrom(msg.sender, address(this), amount);

          emit TransferInitiated(transferId, msg.sender, recipient, amount);
      }

      // Claim refund after timeout
      function claimRefund(bytes32 transferId) external {
          CrossChainTransfer storage transfer = transfers[transferId];

          require(transfer.sender == msg.sender, "Not transfer initiator");
          require(block.timestamp > transfer.deadline, "Timeout not reached");
          require(!transfer.executed, "Transfer already executed");
          require(!transfer.refunded, "Already refunded");

          transfer.refunded = true;
          token.transfer(msg.sender, transfer.amount);

          emit TransferRefunded(transferId);
      }
  }
  ```

- [ ] Handle re-org risks for cross-chain state synchronization

  ```solidity
  contract ReorgAwareBridge {
      // Minimum confirmations required before processing cross-chain messages
      uint256 public requiredConfirmations = 20;

      // Mapping of processed events by block number and transaction hash
      mapping(uint256 => mapping(bytes32 => bool)) public processedEvents;

      function processMessageFromOtherChain(
          uint256 blockNumber,
          bytes32 txHash,
          bytes memory data,
          uint256 confirmations
      ) external {
          // Check sufficient confirmations to mitigate reorg risk
          require(confirmations >= requiredConfirmations, "Not enough confirmations");

          // Check if this event was already processed
          require(!processedEvents[blockNumber][txHash], "Already processed");

          // Mark as processed
          processedEvents[blockNumber][txHash] = true;

          // Process the message
          // ...
      }

      // Allows updating required confirmations based on network conditions
      function updateRequiredConfirmations(uint256 newValue) external onlyGovernance {
          requiredConfirmations = newValue;
      }
  }
  ```

- [ ] Implement chain ID validation to prevent cross-chain replay attacks

  ```solidity
  contract ChainIdAwareContract {
      uint256 public immutable chainId;

      constructor() {
          uint256 id;
          assembly {
              id := chainid()
          }
          chainId = id;
      }

      function processSignedMessage(bytes32 message, bytes memory signature) external {
          // Recover the signer of the message
          address signer = recoverSigner(message, signature);

          // Verify the message includes the correct chain ID
          bytes32 expectedMessage = keccak256(abi.encodePacked(message, chainId));
          require(
              verifyMessage(expectedMessage, signature),
              "Signature not valid for this chain"
          );

          // Process the message
          // ...
      }
  }
  ```

- [ ] Track and monitor cross-chain liquidity risks

  ```solidity
  contract LiquidityMonitoredBridge {
      // Maximum amount of tokens that can be bridged at once
      uint256 public maxTransferAmount;

      // Current liquidity pool on this chain
      uint256 public liquidity;

      // Bridge utilization tracking
      uint256 public bridgeOutflowToday;
      uint256 public bridgeInflowToday;
      uint256 public lastResetTimestamp;

      function bridgeTokens(uint256 amount, address recipient, uint256 targetChain) external {
          // Check if the amount is within transfer limits
          require(amount <= maxTransferAmount, "Transfer amount too large");

          // Check if there's sufficient liquidity on the target chain
          require(
              checkTargetChainLiquidity(targetChain, amount),
              "Insufficient liquidity on target chain"
          );

          // Reset daily counters if day has changed
          if (block.timestamp - lastResetTimestamp > 1 days) {
              bridgeOutflowToday = 0;
              bridgeInflowToday = 0;
              lastResetTimestamp = block.timestamp;
          }

          // Update outflow tracker
          bridgeOutflowToday += amount;

          // Additional checks for daily limits, etc.
          // ...

          // Execute the bridge operation
          // ...
      }

      // Emergency circuit breaker
      function pauseBridge() external onlyGuardian {
          _pause();
          emit BridgePaused(block.timestamp);
      }
  }
  ```

## Formal Verification

- [ ] Consider using formal verification tools to mathematically prove contract correctness

  ```solidity
  // Example property specification for formal verification
  // Using tools like Certora, Mythril, or SMTChecker

  /// @custom:invariant totalSupply == sum(balances)
  /// @custom:invariant forall (address a) balances[a] <= totalSupply
  contract VerifiedToken {
      mapping(address => uint256) public balances;
      uint256 public totalSupply;

      // Functions can have pre and post conditions
      /// @custom:precondition amount <= balances[msg.sender]
      /// @custom:postcondition balances[msg.sender] == old(balances[msg.sender]) - amount
      /// @custom:postcondition balances[to] == old(balances[to]) + amount
      function transfer(address to, uint256 amount) external {
          require(balances[msg.sender] >= amount, "Insufficient balance");
          balances[msg.sender] -= amount;
          balances[to] += amount;
      }
  }
  ```

- [ ] Define and verify critical invariants for your contracts

  ```solidity
  // Key invariants to prove:
  // 1. Conservation of tokens (sum of balances equals totalSupply)
  // 2. User balances are always non-negative
  // 3. Only authorized users can perform privileged operations
  // 4. State transitions follow expected patterns
  ```

- [ ] Use the Solidity SMTChecker for basic verification

  ```solidity
  // Enable SMTChecker in your Solidity code
  /// @custom:smtchecker contracts-show-proved
  contract SMTCheckedContract {
      uint256 public x;

      function setX(uint256 _x) external {
          require(_x < 100, "Value too large");
          uint256 oldX = x;
          x = _x;

          // SMTChecker will verify this assertion
          assert(x < 100);
          assert(x == _x);
      }
  }
  ```

- [ ] Specify and verify pre-conditions and post-conditions for functions

  ```solidity
  /// @custom:precondition balances[msg.sender] >= amount && amount > 0
  /// @custom:postcondition balances[msg.sender] == old(balances[msg.sender]) - amount
  /// @custom:postcondition balances[recipient] == old(balances[recipient]) + amount
  function transfer(address recipient, uint256 amount) external {
      // Function implementation
  }
  ```

- [ ] Verify temporal properties in multi-function and multi-contract scenarios

  ```solidity
  // Properties that involve multiple steps:
  // 1. "If a user deposits funds, they can always withdraw the same amount"
  // 2. "A locked asset cannot be transferred until the timelock expires"
  // 3. "After a security breach, the contract can be paused and no more funds can leave"
  ```

- [ ] Ensure high-risk or high-value contracts undergo formal verification

  ```solidity
  // Priority contracts for formal verification:
  // 1. Token contracts handling user funds
  // 2. Staking and yield-generating contracts
  // 3. Governance mechanisms
  // 4. Cross-chain bridges
  // 5. DeFi protocols with complex interactions
  ```

- [ ] Document formal verification results and limitations

  ```
  ## Formal Verification Report

  ### Verified Properties
  - Conservation of tokens: PROVEN
  - Access control correctness: PROVEN
  - No overflow in calculations: PROVEN

  ### Limitations
  - External contract interactions not verified
  - Only verified up to depth 10 transaction traces
  - Some complex loops abstracted
  ```

- [ ] Combine formal verification with traditional testing for comprehensive coverage

  ```javascript
  // Example integration of formal verification in the development workflow

  // 1. Write contracts with verification annotations
  // 2. Run SMT verification during development
  // Solc --model-checker-engine all --model-checker-targets all contract.sol

  // 3. Write traditional tests for scenarios beyond formal verification scope
  describe('Token transfers', function () {
    it("Should handle transfers that formal verification couldn't fully cover", async function () {
      // Test complex interaction scenarios
      // Test edge cases identified during formal verification
    });
  });

  // 4. For high-value contracts, use specialized tools and experts
  ```

- [ ] Use formal verification to check for reentrancy and other complex vulnerabilities

  ```solidity
  // Properties for reentrancy protection verification
  // 1. "For any function, state updates must precede external calls"
  // 2. "If a function is called reentrantly, it must revert"
  // 3. "The balance invariant holds even under reentrancy attacks"
  ```

## Audit and Review

- [ ] Engage in formal verification for critical contracts
- [ ] Utilize automated tools for vulnerability scanning
- [ ] Conduct manual code reviews with a focus on security
- [ ] Keep up-to-date with the latest security advisories and patch accordingly
- [ ] Consider bug bounty programs to leverage community expertise
- [ ] Review and test all upgrade paths thoroughly before deployment
- [ ] Ensure proper testing of all security mechanisms in place

## Emergency Procedures

- [ ] Implement emergency pause functionality

  ```solidity
  import "@openzeppelin/contracts/security/Pausable.sol";

  contract SecureExchange is Pausable {
      // Only admin can pause
      function pauseTrading() external onlyRole(ADMIN_ROLE) {
          _pause();
      }

      // Only admin can unpause
      function unpauseTrading() external onlyRole(ADMIN_ROLE) {
          _unpause();
      }

      // Functions check paused status
      function executeTrade(uint256 amount) external whenNotPaused {
          // Trading logic
      }
  }
  ```

- [ ] Add circuit breakers for extreme market conditions

  ```solidity
  contract MarketWithCircuitBreakers {
      uint256 public lastPrice;
      uint256 public constant MAX_PRICE_CHANGE_PERCENT = 10; // 10%
      bool public circuitBroken;

      function executeOrder(uint256 newPrice) external {
          // Check if price change exceeds threshold
          if (lastPrice > 0) {
              uint256 priceChange = calculatePercentChange(lastPrice, newPrice);
              if (priceChange > MAX_PRICE_CHANGE_PERCENT) {
                  circuitBroken = true;
                  emit CircuitBreaker(lastPrice, newPrice, priceChange);
                  return;
              }
          }

          // Normal execution if circuit not broken
          if (!circuitBroken) {
              // Execute order logic
              lastPrice = newPrice;
          }
      }

      function resetCircuitBreaker() external onlyAdmin {
          circuitBroken = false;
      }
  }
  ```

- [ ] Create a clear emergency contact process

  ```solidity
  contract EmergencyContact {
      address public securityTeam;
      string public emergencyEmail;

      event EmergencyContact(address indexed reporter, string details);

      function reportEmergency(string calldata details) external {
          emit EmergencyContact(msg.sender, details);
          // Can also trigger notifications off-chain through indexing this event
      }

      function updateEmergencyEmail(string calldata newEmail) external onlyAdmin {
          emergencyEmail = newEmail;
      }
  }
  ```

- [ ] Prepare and document emergency response procedures

  ```markdown
  # Emergency Response Procedure

  1. **Identification**: Monitor events and alerts for potential security incidents
  2. **Assessment**: Security team evaluates impact and severity
  3. **Containment**: If confirmed, activate emergency pause or circuit breakers
  4. **Communication**: Notify users through official channels
  5. **Resolution**: Deploy fix according to upgrade procedure
  6. **Recovery**: Resume operations with enhanced monitoring
  7. **Post-mortem**: Analyze incident, document learnings, improve procedures

  ## Severity Levels

  - **Critical**: Immediate response required (funds at risk)
  - **High**: Response required within 24 hours
  - **Medium**: Response required within 48 hours
  - **Low**: Non-urgent, address in next update
  ```

- [ ] Design and implement fund recovery mechanisms

  ```solidity
  contract RecoverableFunds {
      // Emergency withdrawal function
      function emergencyWithdraw() external onlyRole(EMERGENCY_ROLE) {
          uint256 balance = address(this).balance;
          payable(safeAddress).transfer(balance);
          emit EmergencyWithdrawal(safeAddress, balance);
      }

      // Function to recover ERC20 tokens accidentally sent to contract
      function recoverERC20(address tokenAddress, uint256 amount) external onlyRole(EMERGENCY_ROLE) {
          require(tokenAddress != address(nativeToken), "Cannot withdraw native token");
          IERC20(tokenAddress).transfer(safeAddress, amount);
          emit TokenRecovery(tokenAddress, safeAddress, amount);
      }
  }
  ```

- [ ] Create time-delayed emergency actions

  ```solidity
  contract TimeDelayedRecovery {
      uint256 public constant EMERGENCY_DELAY = 24 hours;
      address public pendingRecoveryAddress;
      uint256 public recoveryProposalTime;

      function proposeRecovery(address newRecoveryAddress) external onlyRole(ADMIN_ROLE) {
          pendingRecoveryAddress = newRecoveryAddress;
          recoveryProposalTime = block.timestamp;
          emit RecoveryProposed(newRecoveryAddress);
      }

      function executeRecovery() external onlyRole(ADMIN_ROLE) {
          require(block.timestamp >= recoveryProposalTime + EMERGENCY_DELAY, "Delay not satisfied");
          require(pendingRecoveryAddress != address(0), "No recovery pending");

          // Transfer funds to recovery address
          uint256 balance = address(this).balance;
          payable(pendingRecoveryAddress).transfer(balance);

          // Reset proposal
          pendingRecoveryAddress = address(0);
          recoveryProposalTime = 0;

          emit RecoveryExecuted(pendingRecoveryAddress, balance);
      }
  }
  ```

## Token Standard Compliance

- [ ] Fully implement required ERC functions for your chosen token standard

  ```solidity
  // Example of proper ERC-20 implementation
  contract CompliantERC20 is IERC20 {
      mapping(address => uint256) private _balances;
      mapping(address => mapping(address => uint256)) private _allowances;
      uint256 private _totalSupply;

      function totalSupply() external view override returns (uint256) {
          return _totalSupply;
      }

      function balanceOf(address account) external view override returns (uint256) {
          return _balances[account];
      }

      function transfer(address recipient, uint256 amount) external override returns (bool) {
          _transfer(msg.sender, recipient, amount);
          return true;
      }

      function allowance(address owner, address spender) external view override returns (uint256) {
          return _allowances[owner][spender];
      }

      function approve(address spender, uint256 amount) external override returns (bool) {
          _approve(msg.sender, spender, amount);
          return true;
      }

      function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
          _transfer(sender, recipient, amount);
          _approve(sender, msg.sender, _allowances[sender][msg.sender] - amount);
          return true;
      }
  }
  ```

- [ ] Verify return values meet standard specifications

  ```solidity
  // Incorrect implementation
  function transfer(address to, uint256 value) external {
      balances[msg.sender] -= value;
      balances[to] += value;
      // Missing return value!
  }

  // Correct implementation
  function transfer(address to, uint256 value) external returns (bool) {
      balances[msg.sender] -= value;
      balances[to] += value;
      emit Transfer(msg.sender, to, value);
      return true;
  }
  ```

- [ ] Emit all required events for token operations

  ```solidity
  function transfer(address recipient, uint256 amount) external override returns (bool) {
      _balances[msg.sender] -= amount;
      _balances[recipient] += amount;

      // Required ERC-20 event
      emit Transfer(msg.sender, recipient, amount);
      return true;
  }

  function approve(address spender, uint256 amount) external override returns (bool) {
      _allowances[msg.sender][spender] = amount;

      // Required ERC-20 event
      emit Approval(msg.sender, spender, amount);
      return true;
  }
  ```

- [ ] Ensure decimals() function returns the correct value for fungible tokens

  ```solidity
  // For ERC-20 tokens
  uint8 private constant _decimals = 18;

  function decimals() public view returns (uint8) {
      return _decimals;
  }
  ```

- [ ] Follow best practices for specific token standards:

  * *ERC-20 Best Practices:**

  - [ ] Protect against ERC-20 approve/transferFrom race conditions

  ```solidity
  // Vulnerable to race condition
  function approve(address spender, uint256 value) external {
      allowed[msg.sender][spender] = value;
  }

  // Safer approach - force user to reset approval to zero first
  function safeApprove(address spender, uint256 currentValue, uint256 value) external {
      require(allowed[msg.sender][spender] == currentValue, "Current allowance mismatch");
      allowed[msg.sender][spender] = value;
  }

  // Alternative - increaseAllowance/decreaseAllowance pattern
  function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
      _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
      return true;
  }

  function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
      uint256 currentAllowance = _allowances[msg.sender][spender];
      require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
      _approve(msg.sender, spender, currentAllowance - subtractedValue);
      return true;
  }
  ```

  - [ ] Always emit Transfer event when minting/burning tokens
  - [ ] Consider implementing ERC-20 permit extension for gasless approvals

  * *ERC-721 Best Practices:**

  - [ ] Check for ownership before transfers

  ```solidity
  function transferFrom(address from, address to, uint256 tokenId) public override {
      require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not owner nor approved");
      _transfer(from, to, tokenId);
  }

  function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
      require(_exists(tokenId), "ERC721: token does not exist");
      address owner = ownerOf(tokenId);
      return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
  }
  ```

  - [ ] Correctly implement onERC721Received to prevent tokens from being locked in contracts

  ```solidity
  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public override {
      transferFrom(from, to, tokenId);

      // If the recipient is a contract, verify it implements onERC721Received
      if (to.isContract()) {
          try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, _data) returns (bytes4 retval) {
              require(retval == IERC721Receiver.onERC721Received.selector, "ERC721: transfer to non-ERC721Receiver implementation");
          } catch (bytes memory reason) {
              if (reason.length == 0) {
                  revert("ERC721: transfer to non-ERC721Receiver implementation");
              } else {
                  assembly {
                      revert(add(32, reason), mload(reason))
                  }
              }
          }
      }
  }
  ```

  * *ERC-1155 Best Practices:**

  - [ ] Implement batch functions efficiently

  ```solidity
  function safeBatchTransferFrom(
      address from,
      address to,
      uint256[] memory ids,
      uint256[] memory amounts,
      bytes memory data
  ) public override {
      require(from == msg.sender || isApprovedForAll(from, msg.sender), "ERC1155: caller is not owner nor approved");
      require(to != address(0), "ERC1155: transfer to the zero address");
      require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

      // Batch transfer operations
      for (uint256 i = 0; i < ids.length; ++i) {
          uint256 id = ids[i];
          uint256 amount = amounts[i];

          uint256 fromBalance = _balances[id][from];
          require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
          _balances[id][from] = fromBalance - amount;
          _balances[id][to] += amount;
      }

      emit TransferBatch(msg.sender, from, to, ids, amounts);

      // Call ERC1155Receiver implementation if recipient is a contract
      _doSafeBatchTransferAcceptanceCheck(msg.sender, from, to, ids, amounts, data);
  }
  ```

  - [ ] Always check array length matches between ids and values

- [ ] Consider EIP-165 support for interface detection

  ```solidity
  import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

  contract MyNFT is ERC721, ERC165 {
      function supportsInterface(bytes4 interfaceId) public view override(ERC165, ERC721) returns (bool) {
          return
              interfaceId == type(IERC721).interfaceId ||
              interfaceId == type(IERC721Metadata).interfaceId ||
              super.supportsInterface(interfaceId);
      }
  }
  ```

- [ ] Validate all tokens against automated compliance tools

  ```bash
  # Example check using slither token checker
  slither-check-erc my_token.sol MyToken
  ```

- [ ] Run test suites against standard reference implementations

  ```javascript
  // Example using OpenZeppelin Test Helpers
  const { expectRevert } = require('@openzeppelin/test-helpers');

  it('reverts when transferring tokens to the zero address', async function () {
    await expectRevert(
      this.token.transfer(ZERO_ADDRESS, amount, { from: holder }),
      'ERC20: transfer to the zero address'
    );
  });
  ```

- [ ] If creating a wrapped token, ensure 1:1 backing and redemption

  ```solidity
  // Example of a wrapped token with 1:1 backing
  contract WrappedToken is ERC20 {
      function deposit() external payable {
          _mint(msg.sender, msg.value);
      }

      function withdraw(uint256 amount) external {
          require(balanceOf(msg.sender) >= amount, "Insufficient balance");
          _burn(msg.sender, amount);
          payable(msg.sender).transfer(amount);
      }
  }
  ```

- [ ] Create detailed documentation of any extensions or deviations from standard

  ```solidity
  /**
   * @title Enhanced ERC-20 Token
   * @dev This implementation adds the following features:
   * - Permit functionality (EIP-2612) for gasless transactions
   * - Token recovery for accidentally sent tokens
   * - Snapshot functionality for governance use cases
   * - Deviation from ERC-20: transfer and transferFrom revert instead of returning false
   * /
  contract EnhancedToken is ERC20 {
      // Implementation...
  }
  ```

- [ ] Consider implementing access control for token minting/burning

  ```solidity
  contract ControlledToken is ERC20, AccessControl {
      bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
      bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

      constructor() ERC20("Controlled Token", "CTL") {
          _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
          _setupRole(MINTER_ROLE, msg.sender);
          _setupRole(BURNER_ROLE, msg.sender);
      }

      function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
          _mint(to, amount);
      }

      function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
          _burn(from, amount);
      }
  }
  ```

- [ ] Maintain backwards compatibility when upgrading token implementations

  ```solidity
  // When upgrading existing tokens, ensure state variables maintain the same slots
  // V1 Implementation
  contract TokenV1 {
      mapping(address => uint256) private _balances;
      mapping(address => mapping(address => uint256)) private _allowances;
      uint256 private _totalSupply;

      // V1 functionality...
  }

  // V2 Implementation - Preserves original storage layout
  contract TokenV2 {
      mapping(address => uint256) private _balances;
      mapping(address => mapping(address => uint256)) private _allowances;
      uint256 private _totalSupply;

      // New storage variables
      mapping(address => bool) private _frozen;

      // V2 functionality...
  }
  ```

- [ ] If creating a token bridge/wrapper, ensure strict security validation

  ```solidity
  contract TokenBridge {
      // Verify signatures from the required number of validators
      function withdraw(
          bytes32 txHash,
          uint256 amount,
          address recipient,
          uint256 timestamp,
          bytes[] calldata signatures
      ) external {
          // Check that this message hasn't been processed before
          require(!processedMessages[messageId], "Message already processed");

          // Verify the message is valid
          require(verifyMessageProof(messageId, data, proof), "Invalid message proof");

          // Mark message as processed before execution to prevent reentrancy
          processedMessages[messageId] = true;

          // Execute the message logic
          _executeMessage(data);
      }
  }
  ```

## Security Auditing

- [ ] Engage in formal verification for critical contracts
- [ ] Utilize automated tools for vulnerability scanning
- [ ] Conduct manual code reviews with a focus on security
- [ ] Keep up-to-date with the latest security advisories and patch accordingly
- [ ] Consider bug bounty programs to leverage community expertise
- [ ] Review and test all upgrade paths thoroughly before deployment
- [ ] Ensure proper testing of all security mechanisms in place

