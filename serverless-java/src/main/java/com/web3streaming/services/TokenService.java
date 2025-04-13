package com.web3streaming.services;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.web3j.crypto.ECDSASignature;
import org.web3j.crypto.Hash;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Service for handling blockchain token operations.
 */
public class TokenService {

    private static final Logger logger = LogManager.getLogger(TokenService.class);
    private final Web3j web3j;
    private static final String RPC_ENDPOINT = System.getenv("ETH_RPC_ENDPOINT");
    
    // Supported token contract addresses by network
    private static final Map<String, Map<String, String>> SUPPORTED_TOKENS = new HashMap<>();
    
    static {
        // Ethereum Mainnet tokens
        Map<String, String> mainnetTokens = new HashMap<>();
        mainnetTokens.put("Web3StreamToken", "0x1234567890abcdef1234567890abcdef12345678");
        mainnetTokens.put("CreatorToken", "0xabcdef1234567890abcdef1234567890abcdef12");
        SUPPORTED_TOKENS.put("mainnet", mainnetTokens);
        
        // Polygon tokens
        Map<String, String> polygonTokens = new HashMap<>();
        polygonTokens.put("Web3StreamToken", "0x9876543210fedcba9876543210fedcba98765432");
        polygonTokens.put("CreatorToken", "0xfedcba9876543210fedcba9876543210fedcba98");
        SUPPORTED_TOKENS.put("polygon", polygonTokens);
    }

    public TokenService() {
        if (RPC_ENDPOINT == null || RPC_ENDPOINT.isEmpty()) {
            logger.warn("ETH_RPC_ENDPOINT environment variable not set. Using default Ethereum node.");
            this.web3j = Web3j.build(new HttpService("https://eth-mainnet.alchemyapi.io/v2/demo"));
        } else {
            this.web3j = Web3j.build(new HttpService(RPC_ENDPOINT));
        }
    }

    /**
     * Get token balance for a wallet address.
     * 
     * @param tokenAddress Contract address of the token
     * @param walletAddress Wallet address to check balance for
     * @return Token balance as a string
     * @throws Exception if there's an error retrieving the balance
     */
    public String getTokenBalance(String tokenAddress, String walletAddress) throws Exception {
        try {
            // Create ERC20 contract instance
            ERC20Interface token = ERC20Interface.load(
                tokenAddress, 
                web3j, 
                null, // No credentials needed for read-only operations
                new DefaultGasProvider()
            );
            
            BigInteger balance = token.balanceOf(walletAddress).send();
            return balance.toString();
        } catch (Exception e) {
            logger.error("Error getting token balance", e);
            throw new Exception("Failed to get token balance: " + e.getMessage());
        }
    }

    /**
     * Verify if a wallet owns tokens from a specific contract.
     * 
     * @param tokenAddress Contract address of the token
     * @param walletAddress Wallet address to check ownership for
     * @return true if the wallet owns tokens, false otherwise
     * @throws Exception if there's an error during verification
     */
    public boolean verifyTokenOwnership(String tokenAddress, String walletAddress) throws Exception {
        try {
            String balance = getTokenBalance(tokenAddress, walletAddress);
            BigInteger tokenBalance = new BigInteger(balance);
            return tokenBalance.compareTo(BigInteger.ZERO) > 0;
        } catch (Exception e) {
            logger.error("Error verifying token ownership", e);
            throw new Exception("Failed to verify token ownership: " + e.getMessage());
        }
    }

    /**
     * Get supported tokens across all networks.
     * 
     * @return List of supported token information
     */
    public List<Map<String, Object>> getSupportedTokens() {
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Map.Entry<String, Map<String, String>> networkEntry : SUPPORTED_TOKENS.entrySet()) {
            String network = networkEntry.getKey();
            Map<String, String> tokens = networkEntry.getValue();
            
            for (Map.Entry<String, String> tokenEntry : tokens.entrySet()) {
                Map<String, Object> tokenInfo = new HashMap<>();
                tokenInfo.put("network", network);
                tokenInfo.put("name", tokenEntry.getKey());
                tokenInfo.put("address", tokenEntry.getValue());
                result.add(tokenInfo);
            }
        }
        
        return result;
    }

    /**
     * Verify a signed message from a wallet.
     * 
     * @param walletAddress Wallet address that signed the message
     * @param message Original message that was signed
     * @param signature Signature to verify
     * @return true if the signature is valid, false otherwise
     */
    public boolean verifySignedMessage(String walletAddress, String message, String signature) {
        try {
            // Create the Ethereum prefixed message
            String prefix = "\u0019Ethereum Signed Message:\n" + message.length();
            byte[] prefixedMessage = Hash.sha3((prefix + message).getBytes());
            
            // Convert signature to bytes and split into components
            byte[] signatureBytes = Numeric.hexStringToByteArray(signature);
            byte v = signatureBytes[64];
            if (v < 27) {
                v += 27;
            }
            
            byte[] r = new byte[32];
            byte[] s = new byte[32];
            System.arraycopy(signatureBytes, 0, r, 0, 32);
            System.arraycopy(signatureBytes, 32, s, 0, 32);
            
            // Create signature object
            ECDSASignature ecdsaSignature = new ECDSASignature(
                new BigInteger(1, r),
                new BigInteger(1, s)
            );
            
            // Recover the public key
            BigInteger publicKey = Sign.recoverFromSignature(
                v - 27,
                ecdsaSignature,
                prefixedMessage
            );
            
            if (publicKey == null) {
                return false;
            }
            
            // Generate address from public key and compare
            String recoveredAddress = "0x" + Keys.getAddress(publicKey);
            return recoveredAddress.equalsIgnoreCase(walletAddress);
            
        } catch (Exception e) {
            logger.error("Error verifying signature", e);
            return false;
        }
    }
}

/**
 * Interface for ERC20 token contract.
 */
interface ERC20Interface {
    org.web3j.protocol.core.RemoteCall<BigInteger> balanceOf(String owner);
    
    static ERC20Interface load(
            String contractAddress,
            Web3j web3j,
            org.web3j.crypto.Credentials credentials,
            org.web3j.tx.gas.ContractGasProvider contractGasProvider) {
        
        return new ERC20Interface() {
            @Override
            public org.web3j.protocol.core.RemoteCall<BigInteger> balanceOf(String owner) {
                return new org.web3j.protocol.core.RemoteCall<>(() -> {
                    String encodedFunction = org.web3j.abi.FunctionEncoder.encode(
                        new org.web3j.abi.datatypes.Function(
                            "balanceOf",
                            java.util.Arrays.asList(new org.web3j.abi.datatypes.Address(owner)),
                            java.util.Arrays.asList(new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.generated.Uint256>() {})
                        )
                    );
                    
                    org.web3j.protocol.core.methods.request.Transaction transaction =
                        org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                            "0x0000000000000000000000000000000000000000", // From address (not needed for view function)
                            contractAddress,
                            encodedFunction
                        );
                    
                    String value = web3j.ethCall(transaction, org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
                        .send()
                        .getValue();
                    
                    java.util.List<org.web3j.abi.datatypes.Type> values = org.web3j.abi.FunctionReturnDecoder.decode(
                        value,
                        org.web3j.abi.Utils.convert(java.util.Arrays.asList(
                            new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.generated.Uint256>() {}
                        ))
                    );
                    
                    return ((org.web3j.abi.datatypes.generated.Uint256) values.get(0)).getValue();
                });
            }
        };
    }
}