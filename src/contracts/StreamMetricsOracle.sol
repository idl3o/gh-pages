// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "./StreamEcosystem.sol";

/**
 * @title StreamMetricsOracle
 * @dev Oracle contract that collects metrics from off-chain sources
 * and provides them to the ecosystem for homeostatic regulation
 */
contract StreamMetricsOracle is AccessControl, Pausable, ChainlinkClient {
    using Chainlink for Chainlink.Request;

    // Roles
    bytes32 public constant DATA_PROVIDER_ROLE = keccak256("DATA_PROVIDER_ROLE");
    bytes32 public constant AUTOMATION_ROLE = keccak256("AUTOMATION_ROLE");

    // The StreamEcosystem contract that uses these metrics
    StreamEcosystem public ecosystemContract;

    // Chainlink variables
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    // Metrics update interval
    uint256 public updateInterval = 4 hours;
    uint256 public lastUpdateTimestamp;

    // Metrics with safety ranges
    struct MetricBounds {
        uint256 min;
        uint256 max;
        uint256 lastValue;
    }

    mapping(string => MetricBounds) public metricBounds;

    // Events
    event MetricsUpdated(
        uint256 creatorToViewerRatio,
        uint256 dailyActiveRatio,
        uint256 avgTransactionCount,
        uint256 contentCreationRate,
        uint256 tokenVelocity,
        uint256 rewardEfficiency,
        uint256 timestamp
    );
    event MetricOutOfBounds(string metric, uint256 value, uint256 min, uint256 max);

    /**
     * @dev Constructor sets up the oracle and roles
     */
    constructor(
        address _ecosystemContract,
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _fee,
        address _admin,
        address _dataProvider
    ) {
        ecosystemContract = StreamEcosystem(_ecosystemContract);

        // Set up Chainlink
        setChainlinkToken(_link);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;

        // Set up roles
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(DATA_PROVIDER_ROLE, _dataProvider);
        _setupRole(AUTOMATION_ROLE, _dataProvider); // Initially same as data provider

        // Initialize metric bounds with reasonable defaults
        metricBounds["creatorToViewerRatio"] = MetricBounds({min: 5, max: 100, lastValue: 20});
        metricBounds["dailyActiveRatio"] = MetricBounds({min: 50, max: 800, lastValue: 300});
        metricBounds["avgTransactionCount"] = MetricBounds({min: 10, max: 1000, lastValue: 100});
        metricBounds["contentCreationRate"] = MetricBounds({min: 5, max: 500, lastValue: 50});
        metricBounds["tokenVelocity"] = MetricBounds({min: 50, max: 2000, lastValue: 500});
        metricBounds["rewardEfficiency"] = MetricBounds({min: 20, max: 500, lastValue: 100});

        lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @dev Submit metrics from authorized data provider
     */
    function submitMetrics(
        uint256 _creatorToViewerRatio,
        uint256 _dailyActiveRatio,
        uint256 _avgTransactionCount,
        uint256 _contentCreationRate,
        uint256 _tokenVelocity,
        uint256 _rewardEfficiency
    ) external onlyRole(DATA_PROVIDER_ROLE) whenNotPaused {
        // Validate metrics against acceptable bounds
        validateMetric("creatorToViewerRatio", _creatorToViewerRatio);
        validateMetric("dailyActiveRatio", _dailyActiveRatio);
        validateMetric("avgTransactionCount", _avgTransactionCount);
        validateMetric("contentCreationRate", _contentCreationRate);
        validateMetric("tokenVelocity", _tokenVelocity);
        validateMetric("rewardEfficiency", _rewardEfficiency);

        // Update ecosystem with new metrics
        ecosystemContract.updateMetrics(
            _creatorToViewerRatio,
            _dailyActiveRatio,
            _avgTransactionCount,
            _contentCreationRate,
            _tokenVelocity,
            _rewardEfficiency
        );

        // Update storage
        metricBounds["creatorToViewerRatio"].lastValue = _creatorToViewerRatio;
        metricBounds["dailyActiveRatio"].lastValue = _dailyActiveRatio;
        metricBounds["avgTransactionCount"].lastValue = _avgTransactionCount;
        metricBounds["contentCreationRate"].lastValue = _contentCreationRate;
        metricBounds["tokenVelocity"].lastValue = _tokenVelocity;
        metricBounds["rewardEfficiency"].lastValue = _rewardEfficiency;

        lastUpdateTimestamp = block.timestamp;

        emit MetricsUpdated(
            _creatorToViewerRatio,
            _dailyActiveRatio,
            _avgTransactionCount,
            _contentCreationRate,
            _tokenVelocity,
            _rewardEfficiency,
            block.timestamp
        );
    }

    /**
     * @dev Validate that a metric falls within acceptable bounds
     */
    function validateMetric(string memory metric, uint256 value) internal view {
        MetricBounds memory bounds = metricBounds[metric];

        // Check if value is within acceptable range
        require(value >= bounds.min, string(abi.encodePacked(metric, " below minimum")));
        require(value <= bounds.max, string(abi.encodePacked(metric, " above maximum")));

        // Check for implausible rapid changes (anti-manipulation)
        uint256 lastValue = bounds.lastValue;
        if (lastValue > 0) {
            // If change is more than 50% in either direction, it's suspicious
            if (value > lastValue && value > lastValue * 3/2) {
                revert(string(abi.encodePacked(metric, " increasing too rapidly")));
            }
            if (value < lastValue && value * 3/2 < lastValue) {
                revert(string(abi.encodePacked(metric, " decreasing too rapidly")));
            }
        }
    }

    /**
     * @dev Update acceptable bounds for a metric
     */
    function updateMetricBounds(
        string calldata metric,
        uint256 min,
        uint256 max
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(max > min, "Max must be greater than min");

        metricBounds[metric].min = min;
        metricBounds[metric].max = max;
    }

    /**
     * @dev Request metrics from Chainlink oracle (automated data fetching)
     */
    function requestMetricsUpdate() external onlyRole(AUTOMATION_ROLE) whenNotPaused {
        require(
            block.timestamp >= lastUpdateTimestamp + updateInterval,
            "Too soon for update"
        );

        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillMetricsUpdate.selector
        );

        // Add parameters for the oracle to know what data to fetch
        request.add("endpoint", "platform_metrics");

        // Send request to Chainlink oracle
        sendChainlinkRequestTo(oracle, request, fee);
    }

    /**
     * @dev Callback function for Chainlink oracle to deliver metrics
     */
    function fulfillMetricsUpdate(
        bytes32 _requestId,
        uint256 _creatorToViewerRatio,
        uint256 _dailyActiveRatio,
        uint256 _avgTransactionCount,
        uint256 _contentCreationRate,
        uint256 _tokenVelocity,
        uint256 _rewardEfficiency
    ) external recordChainlinkFulfillment(_requestId) {
        // Simply call the manual submission function
        // This reuses all the validation and processing logic
        this.submitMetrics(
            _creatorToViewerRatio,
            _dailyActiveRatio,
            _avgTransactionCount,
            _contentCreationRate,
            _tokenVelocity,
            _rewardEfficiency
        );
    }

    /**
     * @dev Update the update interval
     */
    function setUpdateInterval(uint256 _interval) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_interval >= 1 hours && _interval <= 24 hours, "Interval out of range");
        updateInterval = _interval;
    }

    /**
     * @dev Update ecosystem contract address
     */
    function setEcosystemContract(address _newContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newContract != address(0), "Invalid address");
        ecosystemContract = StreamEcosystem(_newContract);
    }

    /**
     * @dev Update Chainlink parameters
     */
    function updateChainlinkParams(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    /**
     * @dev Pause the oracle in case of emergency
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the oracle after emergency
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
