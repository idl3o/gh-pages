// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StreamAMM
 * @dev A custom Automated Market Maker (AMM) for the StreamChain platform
 * Provides low-fee token swaps without relying on external exchanges
 */
contract StreamAMM is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Stream token address
    IERC20 public streamToken;

    // Supported tokens for pairing with Stream token
    mapping(address => bool) public supportedTokens;

    // Fee configuration (expressed in basis points, e.g., 30 = 0.3%)
    uint16 public platformFeeBps = 30; // Default 0.3%
    uint16 public lpFeeBps = 20; // Default 0.2%
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
    address public treasuryAddress;

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
     * @dev Sets the treasury address
     * @param _treasury New treasury address
     */
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "StreamAMM: INVALID_TREASURY");
        treasuryAddress = _treasury;
    }

    /**
     * @dev Adds a token to the supported list
     * @param _token Token address to add
     */
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "StreamAMM: INVALID_TOKEN");
        require(_token != address(streamToken), "StreamAMM: CANNOT_ADD_STREAM_TOKEN");
        supportedTokens[_token] = true;
        emit TokenSupportAdded(_token);
    }

    /**
     * @dev Removes a token from the supported list
     * @param _token Token address to remove
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "StreamAMM: TOKEN_NOT_SUPPORTED");
        supportedTokens[_token] = false;
        emit TokenSupportRemoved(_token);
    }

    /**
     * @dev Updates fee parameters
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
     * @dev Adds liquidity to a pool
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

        // Transfer tokens to the contract
        streamToken.safeTransferFrom(msg.sender, address(this), _streamAmount);
        IERC20(_pairToken).safeTransferFrom(msg.sender, address(this), _pairAmount);

        // Calculate liquidity to mint
        if (pool.totalLiquidity == 0) {
            // Initial liquidity is geometric mean of amounts
            liquidity = sqrt(_streamAmount * _pairAmount);
        } else {
            uint256 liquidityStream = (_streamAmount * pool.totalLiquidity) / pool.streamTokenReserve;
            uint256 liquidityPair = (_pairAmount * pool.totalLiquidity) / pool.pairTokenReserve;
            liquidity = liquidityStream < liquidityPair ? liquidityStream : liquidityPair;
        }

        require(liquidity >= _minLiquidity, "StreamAMM: INSUFFICIENT_LIQUIDITY_MINTED");

        // Update pool state
        pool.streamTokenReserve += _streamAmount;
        pool.pairTokenReserve += _pairAmount;
        pool.totalLiquidity += liquidity;
        pool.liquidityProviders[msg.sender] += liquidity;

        emit LiquidityAdded(msg.sender, _pairToken, _streamAmount, _pairAmount, liquidity);
        return liquidity;
    }

    /**
     * @dev Removes liquidity from a pool
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

        // Calculate token amounts
        streamAmount = (_liquidity * pool.streamTokenReserve) / pool.totalLiquidity;
        pairAmount = (_liquidity * pool.pairTokenReserve) / pool.totalLiquidity;

        require(streamAmount >= _minStreamAmount, "StreamAMM: INSUFFICIENT_STREAM_AMOUNT");
        require(pairAmount >= _minPairAmount, "StreamAMM: INSUFFICIENT_PAIR_AMOUNT");

        // Update pool state
        pool.liquidityProviders[msg.sender] -= _liquidity;
        pool.totalLiquidity -= _liquidity;
        pool.streamTokenReserve -= streamAmount;
        pool.pairTokenReserve -= pairAmount;

        // Transfer tokens
        streamToken.safeTransfer(msg.sender, streamAmount);
        IERC20(_pairToken).safeTransfer(msg.sender, pairAmount);

        emit LiquidityRemoved(msg.sender, _pairToken, streamAmount, pairAmount, _liquidity);
        return (streamAmount, pairAmount);
    }

    /**
     * @dev Swaps tokens with reduced fees compared to traditional exchanges
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

        // Transfer input tokens to this contract
        IERC20(_fromToken).safeTransferFrom(msg.sender, address(this), _amountIn);

        // Calculate the swap
        if (_fromToken == address(streamToken)) {
            Pool storage pool = pools[_toToken];

            // Calculate fees
            uint256 totalFeeBps = platformFeeBps + lpFeeBps;
            uint256 feeAmount = (_amountIn * totalFeeBps) / 10000;
            uint256 platformFeeAmount = (_amountIn * platformFeeBps) / 10000;
            uint256 amountInWithFee = _amountIn - feeAmount;

            // Send platform fee to treasury
            if (platformFeeAmount > 0) {
                streamToken.safeTransfer(treasuryAddress, platformFeeAmount);
            }

            // Calculate output amount using x * y = k formula
            uint256 denominator = pool.streamTokenReserve + amountInWithFee;
            amountOut = (pool.pairTokenReserve * amountInWithFee) / denominator;

            require(amountOut >= _minAmountOut, "StreamAMM: INSUFFICIENT_OUTPUT_AMOUNT");

            // Update pool reserves
            pool.streamTokenReserve += amountInWithFee;
            pool.pairTokenReserve -= amountOut;

            // Send output tokens to user
            IERC20(_toToken).safeTransfer(msg.sender, amountOut);
        } else {
            Pool storage pool = pools[_fromToken];

            // Calculate fees
            uint256 totalFeeBps = platformFeeBps + lpFeeBps;
            uint256 feeAmount = (_amountIn * totalFeeBps) / 10000;
            uint256 platformFeeAmount = (_amountIn * platformFeeBps) / 10000;
            uint256 amountInWithFee = _amountIn - feeAmount;

            // Send platform fee to treasury
            if (platformFeeAmount > 0) {
                IERC20(_fromToken).safeTransfer(treasuryAddress, platformFeeAmount);
            }

            // Calculate output amount using x * y = k formula
            uint256 denominator = pool.pairTokenReserve + amountInWithFee;
            amountOut = (pool.streamTokenReserve * amountInWithFee) / denominator;

            require(amountOut >= _minAmountOut, "StreamAMM: INSUFFICIENT_OUTPUT_AMOUNT");

            // Update pool reserves
            pool.pairTokenReserve += amountInWithFee;
            pool.streamTokenReserve -= amountOut;

            // Send output tokens to user
            streamToken.safeTransfer(msg.sender, amountOut);
        }

        emit TokenSwapped(msg.sender, _fromToken, _toToken, _amountIn, amountOut);
        return amountOut;
    }

    /**
     * @dev Get quotes for swap amounts
     * @param _fromToken From token address
     * @param _toToken To token address
     * @param _amountIn Amount of input tokens
     * @return amountOut Expected amount of output tokens
     */
    function getSwapQuote(
        address _fromToken,
        address _toToken,
        uint256 _amountIn
    ) external view returns (uint256 amountOut) {
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
            uint256 denominator = pool.streamTokenReserve + amountInWithFee;
            amountOut = (pool.pairTokenReserve * amountInWithFee) / denominator;
        } else {
            Pool storage pool = pools[_fromToken];
            uint256 denominator = pool.pairTokenReserve + amountInWithFee;
            amountOut = (pool.streamTokenReserve * amountInWithFee) / denominator;
        }

        return amountOut;
    }

    /**
     * @dev Returns liquidity information for a provider
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

        if (pool.totalLiquidity > 0) {
            streamShare = (liquidity * pool.streamTokenReserve) / pool.totalLiquidity;
            pairShare = (liquidity * pool.pairTokenReserve) / pool.totalLiquidity;
        }

        return (liquidity, streamShare, pairShare);
    }

    /**
     * @dev Helper function to calculate sqrt
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
    }
}
