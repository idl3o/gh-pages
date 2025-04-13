package com.web3streaming.service;

import com.web3streaming.models.ContentItem;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.ECDSASignature;
import org.web3j.crypto.Hash;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.crypto.Sign.SignatureData;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Service for verification operations including cryptographic signatures,
 * blockchain transactions, and content integrity.
 */
public class VerificationService {
    
    private static final Logger logger = LogManager.getLogger(VerificationService.class);
    
    // Default Web3j RPC endpoint if not specified
    private static final String DEFAULT_ETHEREUM_RPC = "https://eth-mainnet.g.alchemy.com/v2/demo";
    
    // Service dependencies
    private final ContentService contentService;
    private final IPFSService ipfsService;
    
    // Web3j instances for different networks
    private final Map<String, Web3j> web3jInstances = new HashMap<>();
    
    public VerificationService() {
        this.contentService = new ContentService();
        this.ipfsService = new IPFSService();
        initializeWeb3j();
    }
    
    /**
     * Verify content integrity by checking IPFS hashes and blockchain records
     * 
     * @param contentId ID of the content to verify
     * @return Map containing verification results
     */
    public Map<String, Object> verifyContentIntegrity(String contentId) {
        logger.info("Verifying content integrity for ID: {}", contentId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("contentId", contentId);
        result.put("timestamp", System.currentTimeMillis());
        
        try {
            // Get content details
            Optional<ContentItem> contentOpt = contentService.getContentById(contentId);
            
            if (contentOpt.isEmpty()) {
                result.put("verified", false);
                result.put("error", "Content not found");
                return result;
            }
            
            ContentItem content = contentOpt.get();
            result.put("contentName", content.getName());
            result.put("creatorAddress", content.getCreatorAddress());
            
            // Verify IPFS content integrity
            String ipfsCid = content.getIpfsCid();
            if (ipfsCid != null && !ipfsCid.isEmpty()) {
                boolean ipfsVerified = ipfsService.verifyContentAvailability(ipfsCid);
                result.put("ipfsVerified", ipfsVerified);
                result.put("ipfsCid", ipfsCid);
            } else {
                result.put("ipfsVerified", false);
                result.put("error", "Content not stored on IPFS");
            }
            
            // Verify blockchain record if available
            String txHash = content.getTransactionHash();
            if (txHash != null && !txHash.isEmpty()) {
                Map<String, Object> txInfo = verifyTransaction(txHash, content.getBlockchain());
                result.put("blockchainVerified", txInfo.get("status") != null && "success".equals(txInfo.get("status")));
                result.put("transactionInfo", txInfo);
            } else {
                result.put("blockchainVerified", false);
            }
            
            // Overall verification status
            boolean ipfsVerified = result.containsKey("ipfsVerified") && (boolean) result.get("ipfsVerified");
            boolean blockchainVerified = result.containsKey("blockchainVerified") && (boolean) result.get("blockchainVerified");
            
            result.put("verified", ipfsVerified && blockchainVerified);
            
            return result;
        } catch (Exception e) {
            logger.error("Error verifying content integrity", e);
            result.put("verified", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    /**
     * Verify Ethereum signature
     * 
     * @param message Original message that was signed
     * @param signature Signature to verify
     * @param address Ethereum address that supposedly signed the message
     * @return true if signature valid, false otherwise
     */
    public boolean verifySignature(String message, String signature, String address) {
        logger.info("Verifying signature. Address: {}, Message: {}", address, message);
        
        try {
            // Hash the message as Ethereum personal signature requires
            byte[] msgHash = Hash.sha3(("\u0019Ethereum Signed Message:\n" + message.length() + message).getBytes());
            
            // Convert hex signature to byte array and extract components
            byte[] sigBytes = Numeric.hexStringToByteArray(signature);
            byte v = sigBytes[64];
            if (v < 27) {
                v += 27;
            }
            
            byte[] r = Arrays.copyOfRange(sigBytes, 0, 32);
            byte[] s = Arrays.copyOfRange(sigBytes, 32, 64);
            
            SignatureData sd = new SignatureData(v, r, s);
            
            // Recover the public key
            BigInteger publicKey = Sign.signedMessageHashToKey(msgHash, sd);
            String recoveredAddress = "0x" + Keys.getAddress(publicKey);
            
            // Compare recovered address to expected address
            return recoveredAddress.equalsIgnoreCase(address);
        } catch (Exception e) {
            logger.error("Error verifying signature", e);
            return false;
        }
    }
    
    /**
     * Verify transaction details on blockchain
     * 
     * @param txHash Transaction hash to verify
     * @param network Blockchain network (ethereum, polygon, etc.)
     * @return Map containing transaction details
     */
    public Map<String, Object> verifyTransaction(String txHash, String network) {
        logger.info("Verifying blockchain transaction. Hash: {}, Network: {}", txHash, network);
        
        Map<String, Object> result = new HashMap<>();
        result.put("transactionHash", txHash);
        result.put("network", network);
        
        try {
            // Default to ethereum if network is null
            String networkName = network != null && !network.isEmpty() ? network : "ethereum";
            Web3j web3j = getWeb3j(networkName);
            
            // Get transaction receipt
            EthGetTransactionReceipt txReceiptResponse = web3j.ethGetTransactionReceipt(txHash).send();
            if (!txReceiptResponse.hasError() && txReceiptResponse.getTransactionReceipt().isPresent()) {
                TransactionReceipt receipt = txReceiptResponse.getTransactionReceipt().get();
                
                // Extract transaction details
                result.put("blockNumber", receipt.getBlockNumber());
                result.put("blockHash", receipt.getBlockHash());
                result.put("from", receipt.getFrom());
                result.put("to", receipt.getTo());
                result.put("status", receipt.isStatusOK() ? "success" : "failed");
                result.put("gasUsed", receipt.getGasUsed());
                result.put("logs", receipt.getLogs().size());
                
                if (receipt.getContractAddress() != null) {
                    result.put("contractAddress", receipt.getContractAddress());
                }
                
            } else {
                result.put("status", "not_found");
                result.put("error", "Transaction receipt not found");
            }
            
            return result;
        } catch (Exception e) {
            logger.error("Error verifying blockchain transaction", e);
            result.put("status", "error");
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    /**
     * Verify that an address is the creator of specific content
     * 
     * @param contentId Content ID to verify
     * @param creatorAddress Creator address to check
     * @return true if address is the creator, false otherwise
     */
    public boolean verifyContentCreator(String contentId, String creatorAddress) {
        logger.info("Verifying content creator. Content ID: {}, Creator: {}", contentId, creatorAddress);
        
        try {
            Optional<ContentItem> contentOpt = contentService.getContentById(contentId);
            
            if (contentOpt.isEmpty()) {
                logger.warn("Content not found: {}", contentId);
                return false;
            }
            
            ContentItem content = contentOpt.get();
            return creatorAddress.equalsIgnoreCase(content.getCreatorAddress());
            
        } catch (Exception e) {
            logger.error("Error verifying content creator", e);
            return false;
        }
    }
    
    /**
     * Initialize Web3j clients for different networks
     */
    private void initializeWeb3j() {
        try {
            // Get RPC URLs from environment or use defaults
            String ethereumRpc = System.getenv("ETHEREUM_RPC_URL");
            if (ethereumRpc == null || ethereumRpc.isEmpty()) {
                ethereumRpc = DEFAULT_ETHEREUM_RPC;
            }
            
            // Initialize Web3j clients
            web3jInstances.put("ethereum", Web3j.build(new HttpService(ethereumRpc)));
            
            // If other networks are needed, add them here
            String polygonRpc = System.getenv("POLYGON_RPC_URL");
            if (polygonRpc != null && !polygonRpc.isEmpty()) {
                web3jInstances.put("polygon", Web3j.build(new HttpService(polygonRpc)));
            }
            
            logger.info("Initialized Web3j clients for blockchain networks");
        } catch (Exception e) {
            logger.error("Failed to initialize Web3j clients", e);
        }
    }
    
    /**
     * Get Web3j instance for a specific network
     * 
     * @param network Network name
     * @return Web3j instance
     */
    private Web3j getWeb3j(String network) {
        Web3j web3j = web3jInstances.get(network.toLowerCase());
        if (web3j == null) {
            if (web3jInstances.containsKey("ethereum")) {
                logger.warn("Network {} not supported, using Ethereum instead", network);
                return web3jInstances.get("ethereum");
            }
            throw new IllegalArgumentException("No blockchain networks are configured");
        }
        return web3j;
    }
}