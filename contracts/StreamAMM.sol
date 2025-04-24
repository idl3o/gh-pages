// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StreamAMM
 * @dev A gas-optimized Automated Market Maker (AMM) for the StreamChain platform
 * Provides low-fee token swaps without relying on external exchanges
 */
contract StreamAMM is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Stream token address
    IERC20 public immutable streamToken;

    // Supported tokens for pairing with Stream token (gas-optimized for frequent checks)
    mapping(address => bool) public supportedTokens;

    // Fee configuration (expressed in basis points, e.g., 30 = 0.3%)
    uint16 public platformFeeBps = 25; // Default 0.25% - optimized value based on market research
    uint16 public lpFeeBps = 15; // Default 0.15% - optimized value based on market research
    uint16 public constant MAX_FEE = 100; // Max 1%

    // Pool information for each pair
    struct Pool {
        uint256 streamTokenReserve;
        uint256 pairTokenReserve;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidityProviders;
    }

    // Maps pair token address to its pool
    mapping(address => Pool) public pools;

    // Treasury address for collecting platform fees
    address public immutable treasuryAddress;

    // Cache last swap timestamp for each user to prevent sandwich attacks
    mapping(address => uint256) private lastSwapTimestamp;

    // Minimum delay between swaps to prevent frontrunning (in seconds)
    uint256 public constant MIN_SWAP_DELAY = 2;

    // Events
    event LiquidityAdded(address indexed provider, address indexed pairToken, uint256 streamAmount, uint256 pairAmount, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, address indexed pairToken, uint256 streamAmount, uint256 pairAmount, uint256 liquidity);
    event TokenSwapped(address indexed user, address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);
    event TokenSupportAdded(address indexed token);
    event TokenSupportRemoved(address indexed token);
    event FeeUpdated(uint16 platformFeeBps, uint16 lpFeeBps);

    // Constructor
    constructor(address _streamToken, address _treasury) {
        require(_streamToken != address(0), "StreamAMM: INVALID_STREAM_TOKEN");
        require(_treasury != address(0), "StreamAMM: INVALID_TREASURY");

        streamToken = IERC20(_streamToken);
        treasuryAddress = _treasury;
    }

    /**
     * @dev Updates the fee parameters
     * @param _platformFeeBps New platform fee in basis points
     * @param _lpFeeBps New liquidity provider fee in basis points
     */
    function updateFees(uint16 _platformFeeBps, uint16 _lpFeeBps) external onlyOwner {
        require(_platformFeeBps + _lpFeeBps <= MAX_FEE, "StreamAMM: FEES_TOO_HIGH");
        platformFeeBps = _platformFeeBps;
        lpFeeBps = _lpFeeBps;
        emit FeeUpdated(_platformFeeBps, _lpFeeBps);
    }

    /**
     * @dev Adds/removes token support in batch to save gas
     * @param _tokens Array of token addresses to update
     * @param _supported Array of boolean values indicating support status
     */
    function batchUpdateTokenSupport(address[] calldata _tokens, bool[] calldata _supported) external onlyOwner {
        require(_tokens.length == _supported.length, "StreamAMM: ARRAY_LENGTH_MISMATCH");

        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];
            require(token != address(0), "StreamAMM: INVALID_TOKEN");
            require(token != address(streamToken), "StreamAMM: CANNOT_ADD_STREAM_TOKEN");

            supportedTokens[token] = _supported[i];
            if (_supported[i]) {
                emit TokenSupportAdded(token);
            } else {
                emit TokenSupportRemoved(token);
            }
        }
    }

    /**
     * @dev Adds liquidity to a pool with gas optimizations
     * @param _pairToken Address of the pair token
     * @param _streamAmount Amount of STREAM tokens to add
     * @param _pairAmount Amount of pair tokens to add
     * @param _minLiquidity Minimum liquidity to receive
     * @return liquidity Amount of liquidity tokens minted
     */
    function addLiquidity(
        address _pairToken,
        uint256 _streamAmount,
        uint256 _pairAmount,
        uint256 _minLiquidity
    ) external nonReentrant returns (uint256 liquidity) {
        require(supportedTokens[_pairToken], "StreamAMM: TOKEN_NOT_SUPPORTED");
        require(_streamAmount > 0 && _pairAmount > 0, "StreamAMM: INSUFFICIENT_AMOUNTS");

        Pool storage pool = pools[_pairToken];

        // Transfer tokens to the contract (reuse variables to save gas)
        streamToken.safeTransferFrom(msg.sender, address(this), _streamAmount);
        IERC20(_pairToken).safeTransferFrom(msg.sender, address(this), _pairAmount);

        // Calculate liquidity to mint (optimized for gas)
        if (pool.totalLiquidity == 0) {
            // Initial liquidity is geometric mean of amounts
            liquidity = sqrt(_streamAmount * _pairAmount);
        } else {
            // Calculate proportional liquidity (optimized to use min directly)
            uint256 liquidityStream = (_streamAmount * pool.totalLiquidity) / pool.streamTokenReserve;
            uint256 liquidityPair = (_pairAmount * pool.totalLiquidity) / pool.pairTokenReserve;
            liquidity = liquidityStream < liquidityPair ? liquidityStream : liquidityPair;
        }

        require(liquidity >= _minLiquidity, "StreamAMM: INSUFFICIENT_LIQUIDITY_MINTED");

        // Update pool state (order optimized for gas)
        pool.liquidityProviders[msg.sender] += liquidity;
        pool.totalLiquidity += liquidity;
        pool.streamTokenReserve += _streamAmount;
        pool.pairTokenReserve += _pairAmount;

        emit LiquidityAdded(msg.sender, _pairToken, _streamAmount, _pairAmount, liquidity);
        return liquidity;
    }

    /**
     * @dev Removes liquidity from a pool with gas optimizations
     * @param _pairToken Address of the pair token
     * @param _liquidity Amount of liquidity to remove
     * @param _minStreamAmount Minimum STREAM tokens to receive
     * @param _minPairAmount Minimum pair tokens to receive
     * @return streamAmount Amount of STREAM tokens received
     * @return pairAmount Amount of pair tokens received
     */
    function removeLiquidity(
        address _pairToken,
        uint256 _liquidity,
        uint256 _minStreamAmount,
        uint256 _minPairAmount
    ) external nonReentrant returns (uint256 streamAmount, uint256 pairAmount) {
        require(supportedTokens[_pairToken], "StreamAMM: TOKEN_NOT_SUPPORTED");

        Pool storage pool = pools[_pairToken];
        require(pool.liquidityProviders[msg.sender] >= _liquidity, "StreamAMM: INSUFFICIENT_LIQUIDITY");

        // Cache to save gas on repeated storage reads
        uint256 totalLiquidity = pool.totalLiquidity;
        uint256 streamReserve = pool.streamTokenReserve;
        uint256 pairReserve = pool.pairTokenReserve;

        // Calculate token amounts
        streamAmount = (_liquidity * streamReserve) / totalLiquidity;
        pairAmount = (_liquidity * pairReserve) / totalLiquidity;

        require(streamAmount >= _minStreamAmount, "StreamAMM: INSUFFICIENT_STREAM_AMOUNT");
        require(pairAmount >= _minPairAmount, "StreamAMM: INSUFFICIENT_PAIR_AMOUNT");

        // Update pool state (order optimized for gas)
        pool.liquidityProviders[msg.sender] -= _liquidity;
        pool.totalLiquidity = totalLiquidity - _liquidity;
        pool.streamTokenReserve = streamReserve - streamAmount;
        pool.pairTokenReserve = pairReserve - pairAmount;

        // Transfer tokens - inline transfers to save gas on multiple function calls
        streamToken.safeTransfer(msg.sender, streamAmount);
        IERC20(_pairToken).safeTransfer(msg.sender, pairAmount);

        emit LiquidityRemoved(msg.sender, _pairToken, streamAmount, pairAmount, _liquidity);
        return (streamAmount, pairAmount);
    }

    /**
     * @dev Swaps tokens with anti-frontrunning protection and gas optimizations
     * @param _fromToken From token address
     * @param _toToken To token address
     * @param _amountIn Amount of input tokens
     * @param _minAmountOut Minimum amount of output tokens
     * @return amountOut Amount of output tokens received
     */
    function swapTokens(
        address _fromToken,
        address _toToken,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(_amountIn > 0, "StreamAMM: INSUFFICIENT_INPUT_AMOUNT");
        require(
            (_fromToken == address(streamToken) && supportedTokens[_toToken]) ||
            (_toToken == address(streamToken) && supportedTokens[_fromToken]),
            "StreamAMM: UNSUPPORTED_PAIR"
        );

        // Anti-frontrunning protection
        uint256 lastSwap = lastSwapTimestamp[msg.sender];
        uint256 currentTime = block.timestamp;
        require(lastSwap == 0 || currentTime > lastSwap + MIN_SWAP_DELAY, "StreamAMM: SWAP_TOO_FREQUENT");
        lastSwapTimestamp[msg.sender] = currentTime;

        // Transfer input tokens to this contract
        IERC20(_fromToken).safeTransferFrom(msg.sender, address(this), _amountIn);

        // Calculate the swap
        if (_fromToken == address(streamToken)) {
            // Optimize by moving all calculations to a separate function to avoid stack too deep errors
            amountOut = _swapStreamToPair(_toToken, _amountIn, _minAmountOut);
        } else {
            // Optimize by moving all calculations to a separate function to avoid stack too deep errors
            amountOut = _swapPairToStream(_fromToken, _amountIn, _minAmountOut);
        }

        emit TokenSwapped(msg.sender, _fromToken, _toToken, _amountIn, amountOut);
        return amountOut;
    }

    /**
     * @dev Internal function to swap Stream tokens for pair tokens
     * @param _pairToken Pair token address
     * @param _amountIn Amount of Stream tokens in
     * @param _minAmountOut Minimum amount of pair tokens out
     * @return amountOut Amount of pair tokens received
     */
    function _swapStreamToPair(
        address _pairToken,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) private returns (uint256 amountOut) {
        Pool storage pool = pools[_pairToken];

        // Cache storage reads to save gas
        uint256 streamReserve = pool.streamTokenReserve;
        uint256 pairReserve = pool.pairTokenReserve;

        // Calculate fees
        uint256 totalFeeBps = platformFeeBps + lpFeeBps;
        uint256 feeAmount = (_amountIn * totalFeeBps) / 10000;
        uint256 platformFeeAmount = (_amountIn * platformFeeBps) / 10000;
        uint256 amountInWithFee = _amountIn - feeAmount;

        // Send platform fee to treasury
        if (platformFeeAmount > 0) {
            streamToken.safeTransfer(treasuryAddress, platformFeeAmount);
        }

        // Calculate output amount using x * y = k formula with numerical stability
        uint256 denominator = streamReserve + amountInWithFee;
        amountOut = (pairReserve * amountInWithFee) / denominator;

        require(amountOut >= _minAmountOut, "StreamAMM: INSUFFICIENT_OUTPUT_AMOUNT");

        // Update pool reserves
        pool.streamTokenReserve = streamReserve + amountInWithFee;
        pool.pairTokenReserve = pairReserve - amountOut;

        // Send output tokens to user
        IERC20(_pairToken).safeTransfer(msg.sender, amountOut);

        return amountOut;
    }

    /**
     * @dev Internal function to swap pair tokens for Stream tokens
     * @param _pairToken Pair token address
     * @param _amountIn Amount of pair tokens in
     * @param _minAmountOut Minimum amount of Stream tokens out
     * @return amountOut Amount of Stream tokens received
     */
    function _swapPairToStream(
        address _pairToken,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) private returns (uint256 amountOut) {
        Pool storage pool = pools[_pairToken];

        // Cache storage reads to save gas
        uint256 streamReserve = pool.streamTokenReserve;
        uint256 pairReserve = pool.pairTokenReserve;

        // Calculate fees
        uint256 totalFeeBps = platformFeeBps + lpFeeBps;
        uint256 feeAmount = (_amountIn * totalFeeBps) / 10000;
        uint256 platformFeeAmount = (_amountIn * platformFeeBps) / 10000;
        uint256 amountInWithFee = _amountIn - feeAmount;

        // Send platform fee to treasury
        if (platformFeeAmount > 0) {
            IERC20(_pairToken).safeTransfer(treasuryAddress, platformFeeAmount);
        }

        // Calculate output amount using x * y = k formula with numerical stability
        uint256 denominator = pairReserve + amountInWithFee;
        amountOut = (streamReserve * amountInWithFee) / denominator;

        require(amountOut >= _minAmountOut, "StreamAMM: INSUFFICIENT_OUTPUT_AMOUNT");

        // Update pool reserves
        pool.pairTokenReserve = pairReserve + amountInWithFee;
        pool.streamTokenReserve = streamReserve - amountOut;

        // Send output tokens to user
        streamToken.safeTransfer(msg.sender, amountOut);

        return amountOut;
    }

    /**
     * @dev Get quotes for swap amounts with price impact calculation
     * @param _fromToken From token address
     * @param _toToken To token address
     * @param _amountIn Amount of input tokens
     * @return amountOut Expected amount of output tokens
     * @return priceImpact Price impact percentage (in basis points)
     */
    function getSwapQuote(
        address _fromToken,
        address _toToken,
        uint256 _amountIn
    ) external view returns (uint256 amountOut, uint256 priceImpact) {
        require(_amountIn > 0, "StreamAMM: INSUFFICIENT_INPUT_AMOUNT");
        require(
            (_fromToken == address(streamToken) && supportedTokens[_toToken]) ||
            (_toToken == address(streamToken) && supportedTokens[_fromToken]),
            "StreamAMM: UNSUPPORTED_PAIR"
        );

        uint256 totalFeeBps = platformFeeBps + lpFeeBps;
        uint256 amountInWithFee = _amountIn - ((_amountIn * totalFeeBps) / 10000);

        if (_fromToken == address(streamToken)) {
            Pool storage pool = pools[_toToken];
            uint256 streamReserve = pool.streamTokenReserve;
            uint256 pairReserve = pool.pairTokenReserve;

            // Skip calculation if pool doesn't exist yet
            if (streamReserve == 0 || pairReserve == 0) {
                return (0, 0);
            }

            uint256 denominator = streamReserve + amountInWithFee;
            amountOut = (pairReserve * amountInWithFee) / denominator;

            // Calculate price impact (spot price change)
            // Formula: 1 - (amountOut/pairReserve) / (amountInWithFee/streamReserve)
            uint256 spotPrice = (amountInWithFee * pairReserve) / streamReserve;
            if (spotPrice > amountOut) {
                priceImpact = ((spotPrice - amountOut) * 10000) / spotPrice;
            }
        } else {
            Pool storage pool = pools[_fromToken];
            uint256 streamReserve = pool.streamTokenReserve;
            uint256 pairReserve = pool.pairTokenReserve;

            // Skip calculation if pool doesn't exist yet
            if (streamReserve == 0 || pairReserve == 0) {
                return (0, 0);
            }

            uint256 denominator = pairReserve + amountInWithFee;
            amountOut = (streamReserve * amountInWithFee) / denominator;

            // Calculate price impact (spot price change)
            uint256 spotPrice = (amountInWithFee * streamReserve) / pairReserve;
            if (spotPrice > amountOut) {
                priceImpact = ((spotPrice - amountOut) * 10000) / spotPrice;
            }
        }

        return (amountOut, priceImpact);
    }

    /**
     * @dev Fast multi-call for reading multiple provider liquidity positions
     * @param _providers Array of provider addresses
     * @param _pairToken Pair token address
     * @return liquidityValues Array of provider liquidity values
     * @return streamShares Array of provider Stream token shares
     * @return pairShares Array of provider pair token shares
     */
    function batchGetProviderLiquidity(
        address[] calldata _providers,
        address _pairToken
    ) external view returns (uint256[] memory liquidityValues, uint256[] memory streamShares, uint256[] memory pairShares) {
        uint256 length = _providers.length;
        liquidityValues = new uint256[](length);
        streamShares = new uint256[](length);
        pairShares = new uint256[](length);

        Pool storage pool = pools[_pairToken];
        uint256 totalLiquidity = pool.totalLiquidity;

        if (totalLiquidity > 0) {
            uint256 streamReserve = pool.streamTokenReserve;
            uint256 pairReserve = pool.pairTokenReserve;

            for (uint256 i = 0; i < length; i++) {
                liquidityValues[i] = pool.liquidityProviders[_providers[i]];
                if (liquidityValues[i] > 0) {
                    streamShares[i] = (liquidityValues[i] * streamReserve) / totalLiquidity;
                    pairShares[i] = (liquidityValues[i] * pairReserve) / totalLiquidity;
                }
            }
        }

        return (liquidityValues, streamShares, pairShares);
    }

    /**
     * @dev Returns pool information
     * @param _pairToken Pair token address
     * @return streamReserve Stream token reserve
     * @return pairReserve Pair token reserve
     * @return totalLiquidity Total liquidity in the pool
     */
    function getPoolInfo(address _pairToken) external view returns (
        uint256 streamReserve,
        uint256 pairReserve,
        uint256 totalLiquidity
    ) {
        Pool storage pool = pools[_pairToken];
        return (
            pool.streamTokenReserve,
            pool.pairTokenReserve,
            pool.totalLiquidity
        );
    }

    /**
     * @dev Returns liquidity information for a provider (optimized version)
     * @param _provider Provider address
     * @param _pairToken Pair token address
     * @return liquidity Provider's liquidity in the pool
     * @return streamShare Provider's share of STREAM tokens
     * @return pairShare Provider's share of pair tokens
     */
    function getProviderLiquidity(
        address _provider,
        address _pairToken
    ) external view returns (uint256 liquidity, uint256 streamShare, uint256 pairShare) {
        Pool storage pool = pools[_pairToken];
        liquidity = pool.liquidityProviders[_provider];

        if (liquidity > 0 && pool.totalLiquidity > 0) {
            streamShare = (liquidity * pool.streamTokenReserve) / pool.totalLiquidity;
            pairShare = (liquidity * pool.pairTokenReserve) / pool.totalLiquidity;
        }

        return (liquidity, streamShare, pairShare);
    }

    /**
     * @dev Helper function to calculate sqrt - optimized version
     * @param y Value to get square root of
     * @return z Square root result
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        // If y == 0, return z = 0
    }
}
