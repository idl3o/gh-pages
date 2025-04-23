// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LazyContentMinter
 * @dev Implements lazy minting for content NFTs, allowing creators to register content
 * without paying gas fees until the content is actually purchased
 */
contract LazyContentMinter is ERC721URIStorage, EIP712, AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Mapping from content ID to whether it has been minted
    mapping(bytes32 => bool) private _mintedContent;

    // Content vouchers store metadata off-chain but can be verified on-chain
    struct ContentVoucher {
        bytes32 contentId;        // Unique identifier for the content
        uint256 tokenId;          // The token ID to use when minting
        uint256 price;            // Price in native tokens or platform token
        address creator;          // Creator address to receive royalties
        uint16 royaltyBps;        // Royalty percentage in basis points (e.g., 1000 = 10%)
        string uri;               // IPFS URI for token metadata
        bytes signature;          // Creator's signature of all fields
    }

    // Platform fee configuration
    uint16 public platformFeeBps = 500; // 5% platform fee by default
    address public platformTreasury;

    // Events
    event ContentRegistered(bytes32 indexed contentId, address indexed creator, uint256 price, string uri);
    event ContentMinted(bytes32 indexed contentId, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event RoyaltyPaid(address indexed creator, uint256 amount);
    event PlatformFeePaid(uint256 amount);

    constructor(string memory _name, string memory _symbol, address _treasury)
        ERC721(_name, _symbol)
        EIP712("LazyContentMinter", "1")
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        platformTreasury = _treasury;
    }

    /**
     * @dev Sets the platform treasury address
     * @param _treasury New treasury address
     */
    function setPlatformTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "LazyMinter: INVALID_TREASURY");
        platformTreasury = _treasury;
    }

    /**
     * @dev Updates the platform fee
     * @param _platformFeeBps New platform fee in basis points
     */
    function setPlatformFee(uint16 _platformFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_platformFeeBps <= 2000, "LazyMinter: FEE_TOO_HIGH"); // Max 20%
        platformFeeBps = _platformFeeBps;
    }

    /**
     * @dev Verifies the signature on a content voucher
     * @param _voucher ContentVoucher containing the signature to verify
     * @return True if the signature is valid
     */
    function verifyVoucher(ContentVoucher calldata _voucher) public view returns (bool) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("ContentVoucher(bytes32 contentId,uint256 tokenId,uint256 price,address creator,uint16 royaltyBps,string uri)"),
            _voucher.contentId,
            _voucher.tokenId,
            _voucher.price,
            _voucher.creator,
            _voucher.royaltyBps,
            keccak256(bytes(_voucher.uri))
        )));

        address signer = digest.recover(_voucher.signature);
        return signer == _voucher.creator;
    }

    /**
     * @dev Mints content using a voucher signed by the content creator
     * @param _voucher ContentVoucher signed by the content creator
     */
    function mintContent(ContentVoucher calldata _voucher) external payable nonReentrant {
        // Make sure the content hasn't been minted already
        require(!_mintedContent[_voucher.contentId], "LazyMinter: ALREADY_MINTED");

        // Verify the voucher's signature is valid
        require(verifyVoucher(_voucher), "LazyMinter: INVALID_SIGNATURE");

        // Make sure sufficient payment is provided
        require(msg.value >= _voucher.price, "LazyMinter: INSUFFICIENT_FUNDS");

        // Calculate fees
        uint256 platformFee = (_voucher.price * platformFeeBps) / 10000;
        uint256 creatorPayment = _voucher.price - platformFee;

        // Mark content as minted to prevent replay
        _mintedContent[_voucher.contentId] = true;

        // Mint the actual NFT
        _mint(msg.sender, _voucher.tokenId);
        _setTokenURI(_voucher.tokenId, _voucher.uri);

        // Transfer funds
        if (platformFee > 0) {
            (bool platformSuccess, ) = platformTreasury.call{value: platformFee}("");
            require(platformSuccess, "LazyMinter: PLATFORM_FEE_TRANSFER_FAILED");
            emit PlatformFeePaid(platformFee);
        }

        if (creatorPayment > 0) {
            (bool creatorSuccess, ) = _voucher.creator.call{value: creatorPayment}("");
            require(creatorSuccess, "LazyMinter: CREATOR_PAYMENT_FAILED");
            emit RoyaltyPaid(_voucher.creator, creatorPayment);
        }

        // Return excess payment if any
        if (msg.value > _voucher.price) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - _voucher.price}("");
            require(refundSuccess, "LazyMinter: REFUND_FAILED");
        }

        emit ContentMinted(_voucher.contentId, _voucher.tokenId, msg.sender, _voucher.price);
    }

    /**
     * @dev Register content without minting it (reservation system)
     * @param _voucher ContentVoucher signed by the content creator
     */
    function registerContent(ContentVoucher calldata _voucher) external {
        // Make sure the content hasn't been registered already
        require(!_mintedContent[_voucher.contentId], "LazyMinter: ALREADY_REGISTERED");

        // Verify the voucher's signature is valid
        require(verifyVoucher(_voucher), "LazyMinter: INVALID_SIGNATURE");

        // Mark as registered but not minted, will happen on purchase
        emit ContentRegistered(_voucher.contentId, _voucher.creator, _voucher.price, _voucher.uri);
    }

    /**
     * @dev Checks if content has been minted
     * @param _contentId Content ID to check
     * @return True if content has been minted
     */
    function isContentMinted(bytes32 _contentId) external view returns (bool) {
        return _mintedContent[_contentId];
    }

    /**
     * @dev Required override for ERC721 compatibility
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
