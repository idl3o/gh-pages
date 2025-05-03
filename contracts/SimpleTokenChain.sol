// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleTokenChain
 * @dev A simplified blockchain implementation with token functionality.
 * Each token represents a block in the chain, with a hash that depends on the previous block.
 */
contract SimpleTokenChain {
    // Block structure
    struct Block {
        uint256 blockNumber;     // Block number (same as token ID)
        uint256 timestamp;       // Block timestamp
        address minter;          // Address that minted the block
        bytes32 previousBlockHash; // Hash of the previous block
        bytes32 blockHash;       // Hash of the current block
        string tokenMetadata;    // Metadata associated with the block/token
    }
    
    // Token data
    string private _name;
    string private _symbol;
    uint256 private _totalSupply;
    uint256 private _blockCount;
    uint256 private _mintPrice;
    
    // Mappings
    mapping(uint256 => Block) private _blocks;
    mapping(uint256 => address) private _tokenOwner;
    mapping(address => uint256) private _balances;
    
    // Events
    event BlockMined(uint256 indexed blockNumber, bytes32 blockHash);
    event TokenMinted(uint256 indexed tokenId, address indexed owner, uint256 blockNumber);
    event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId);
    
    /**
     * @dev Constructor
     * @param tokenName Name of the token
     * @param tokenSymbol Symbol of the token
     * @param mintPrice Price to mint a new token/block
     */
    constructor(string memory tokenName, string memory tokenSymbol, uint256 mintPrice) {
        _name = tokenName;
        _symbol = tokenSymbol;
        _mintPrice = mintPrice;
        
        // Create genesis block
        _createGenesisBlock();
    }
    
    /**
     * @dev Create the genesis block (block 0)
     */
    function _createGenesisBlock() private {
        Block memory genesisBlock = Block({
            blockNumber: 0,
            timestamp: block.timestamp,
            minter: msg.sender,
            previousBlockHash: bytes32(0),
            blockHash: keccak256(abi.encodePacked(block.timestamp, msg.sender, bytes32(0), "Genesis Block")),
            tokenMetadata: "Genesis Block"
        });
        
        _blocks[0] = genesisBlock;
        _tokenOwner[0] = msg.sender;
        _balances[msg.sender] = 1;
        _blockCount = 1;
        _totalSupply = 1;
        
        emit BlockMined(0, genesisBlock.blockHash);
        emit TokenMinted(0, msg.sender, 0);
    }
    
    /**
     * @dev Mint a new token and create a new block
     * @param metadata Metadata to associate with the token
     * @return tokenId ID of the minted token
     */
    function mint(string memory metadata) public payable returns (uint256) {
        require(msg.value >= _mintPrice, "SimpleTokenChain: Insufficient ether sent");
        
        uint256 tokenId = _totalSupply;
        uint256 blockNumber = _blockCount;
        
        // Get previous block hash
        bytes32 previousHash = _blocks[blockNumber - 1].blockHash;
        
        // Create new block
        bytes32 newBlockHash = keccak256(abi.encodePacked(block.timestamp, msg.sender, previousHash, metadata));
        Block memory newBlock = Block({
            blockNumber: blockNumber,
            timestamp: block.timestamp,
            minter: msg.sender,
            previousBlockHash: previousHash,
            blockHash: newBlockHash,
            tokenMetadata: metadata
        });
        
        // Update state
        _blocks[blockNumber] = newBlock;
        _tokenOwner[tokenId] = msg.sender;
        _balances[msg.sender]++;
        _blockCount++;
        _totalSupply++;
        
        emit BlockMined(blockNumber, newBlockHash);
        emit TokenMinted(tokenId, msg.sender, blockNumber);
        
        return tokenId;
    }
    
    /**
     * @dev Transfer a token to another address
     * @param to Address to transfer to
     * @param tokenId ID of the token to transfer
     */
    function transfer(address to, uint256 tokenId) public virtual {
        require(to != address(0), "SimpleTokenChain: Transfer to zero address");
        require(_tokenOwner[tokenId] == msg.sender, "SimpleTokenChain: Not token owner");
        
        _balances[msg.sender]--;
        _balances[to]++;
        _tokenOwner[tokenId] = to;
        
        emit TokenTransferred(msg.sender, to, tokenId);
    }
    
    /**
     * @dev Get a block by its number
     * @param blockNumber The block number
     */
    function getBlock(uint256 blockNumber) public view returns (Block memory) {
        require(blockNumber < _blockCount, "SimpleTokenChain: Invalid block number");
        return _blocks[blockNumber];
    }
    
    /**
     * @dev Get token owner and metadata
     * @param tokenId The token ID
     */
    function getToken(uint256 tokenId) public view returns (address, string memory) {
        require(tokenId < _totalSupply, "SimpleTokenChain: Invalid token ID");
        return (_tokenOwner[tokenId], _blocks[tokenId].tokenMetadata);
    }
    
    /**
     * @dev Check if the chain is valid by verifying all block hashes
     */
    function verifyChain() public view returns (bool) {
        for (uint256 i = 1; i < _blockCount; i++) {
            Block memory currentBlock = _blocks[i];
            Block memory previousBlock = _blocks[i - 1];
            
            // Verify previous hash reference
            if (currentBlock.previousBlockHash != previousBlock.blockHash) {
                return false;
            }
            
            // Verify block hash calculation
            bytes32 calculatedHash = keccak256(abi.encodePacked(
                currentBlock.timestamp,
                currentBlock.minter,
                currentBlock.previousBlockHash,
                currentBlock.tokenMetadata
            ));
            
            if (calculatedHash != currentBlock.blockHash) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev Check if a token exists
     * @param tokenId Token ID to check
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _totalSupply;
    }
    
    // View functions for token data
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    
    function blockCount() public view returns (uint256) {
        return _blockCount;
    }
    
    function mintPrice() public view returns (uint256) {
        return _mintPrice;
    }
    
    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }
    
    function tokenOwner(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "SimpleTokenChain: Query for nonexistent token");
        return _tokenOwner[tokenId];
    }
}