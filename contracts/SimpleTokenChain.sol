// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title SimpleTokenChain
 * @dev A blockchain implementation where each token mint adds a new block to the chain
 */
contract SimpleTokenChain {
    // Block structure
    struct Block {
        uint256 blockNumber;
        uint256 timestamp;
        address minter;
        bytes32 previousBlockHash;
        bytes32 blockHash;
        string tokenMetadata;
    }

    // Token structure
    struct Token {
        uint256 tokenId;
        address owner;
        uint256 blockNumber;
        string metadata;
    }

    // State variables
    string public name;
    string public symbol;
    address public owner;
    uint256 public totalSupply;
    uint256 public blockCount;
    uint256 public mintPrice;
    bool public mintingEnabled;

    // Mapping of token IDs to their owners
    mapping(uint256 => address) public tokenOwner;
    // Mapping of token IDs to their metadata
    mapping(uint256 => string) public tokenMetadata;
    // Mapping of address to their token count
    mapping(address => uint256) public balanceOf;
    // Mapping of block number to Block
    mapping(uint256 => Block) public blocks;
    // Genesis block hash
    bytes32 public genesisBlockHash;

    // Events
    event BlockMined(uint256 indexed blockNumber, bytes32 blockHash);
    event TokenMinted(uint256 indexed tokenId, address indexed owner, uint256 blockNumber);
    event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier mintingIsEnabled() {
        require(mintingEnabled, "Minting is currently disabled");
        _;
    }

    /**
     * @dev Constructor initializes the contract with name and symbol
     */
    constructor(string memory _name, string memory _symbol, uint256 _mintPrice) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        mintingEnabled = true;
        mintPrice = _mintPrice;
        
        // Create genesis block
        bytes32 genesisHash = keccak256(abi.encodePacked(block.timestamp, address(0), bytes32(0), "Genesis Block"));
        blocks[0] = Block(
            0,
            block.timestamp,
            address(0),
            bytes32(0),
            genesisHash,
            "Genesis Block"
        );
        genesisBlockHash = genesisHash;
        blockCount = 1;

        emit BlockMined(0, genesisHash);
    }

    /**
     * @dev Mint a new token and create a new block in the chain
     * @param _metadata Metadata for the token
     */
    function mint(string memory _metadata) public payable mintingIsEnabled {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = totalSupply;
        address tokenMinter = msg.sender;
        
        // Create a new block
        bytes32 previousHash = blocks[blockCount - 1].blockHash;
        bytes32 newBlockHash = keccak256(abi.encodePacked(block.timestamp, tokenMinter, previousHash, _metadata));
        
        blocks[blockCount] = Block(
            blockCount,
            block.timestamp,
            tokenMinter,
            previousHash,
            newBlockHash,
            _metadata
        );

        // Mint the token
        tokenOwner[tokenId] = tokenMinter;
        tokenMetadata[tokenId] = _metadata;
        balanceOf[tokenMinter]++;
        
        totalSupply++;
        blockCount++;

        emit BlockMined(blockCount - 1, newBlockHash);
        emit TokenMinted(tokenId, tokenMinter, blockCount - 1);
    }

    /**
     * @dev Transfer a token to another address
     * @param _to Address to transfer to
     * @param _tokenId ID of the token
     */
    function transfer(address _to, uint256 _tokenId) public {
        require(tokenOwner[_tokenId] == msg.sender, "You don't own this token");
        require(_to != address(0), "Cannot transfer to zero address");
        
        tokenOwner[_tokenId] = _to;
        balanceOf[msg.sender]--;
        balanceOf[_to]++;
        
        emit TokenTransferred(msg.sender, _to, _tokenId);
    }

    /**
     * @dev Get a block by its number
     * @param _blockNumber Block number
     * @return Block structure
     */
    function getBlock(uint256 _blockNumber) public view returns (Block memory) {
        require(_blockNumber < blockCount, "Block does not exist");
        return blocks[_blockNumber];
    }

    /**
     * @dev Get token information
     * @param _tokenId Token ID
     * @return Owner address and metadata
     */
    function getToken(uint256 _tokenId) public view returns (address, string memory) {
        require(_tokenId < totalSupply, "Token does not exist");
        return (tokenOwner[_tokenId], tokenMetadata[_tokenId]);
    }
    
    /**
     * @dev Verify the integrity of the blockchain
     * @return bool True if the chain is valid
     */
    function verifyChain() public view returns (bool) {
        if (blockCount <= 1) return true;
        
        for (uint256 i = 1; i < blockCount; i++) {
            Block memory currentBlock = blocks[i];
            Block memory previousBlock = blocks[i-1];
            
            // Verify previous hash reference
            if (currentBlock.previousBlockHash != previousBlock.blockHash) return false;
            
            // Verify block hash calculation
            bytes32 calculatedHash = keccak256(abi.encodePacked(
                currentBlock.timestamp,
                currentBlock.minter,
                currentBlock.previousBlockHash,
                currentBlock.tokenMetadata
            ));
            
            if (calculatedHash != currentBlock.blockHash) return false;
        }
        
        return true;
    }
    
    /**
     * @dev Toggle minting state
     */
    function toggleMinting() public onlyOwner {
        mintingEnabled = !mintingEnabled;
    }
    
    /**
     * @dev Update mint price
     */
    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Withdraw funds from contract
     */
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}