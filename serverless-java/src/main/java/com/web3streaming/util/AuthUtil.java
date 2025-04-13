package com.web3streaming.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.web3j.crypto.ECDSASignature;
import org.web3j.crypto.Hash;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
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
 * Utility for Web3 authentication and JWT token management.
 */
public class AuthUtil {

    private static final Logger logger = LogManager.getLogger(AuthUtil.class);
    
    private static final String JWT_SECRET = System.getenv("JWT_SECRET");
    private static final long TOKEN_EXPIRATION = 86400000; // 24 hours
    private static final String AUTHENTICATION_MESSAGE_PREFIX = "Sign this message to authenticate with Web3 Streaming: ";
    
    /**
     * Create a JWT token for the given wallet address
     * 
     * @param walletAddress ETH wallet address
     * @return JWT token string
     */
    public static String createJwtToken(String walletAddress) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + TOKEN_EXPIRATION);
            
            // Use HMAC256 algorithm for token signing
            Algorithm algorithm = Algorithm.HMAC256(getJwtSecret());
            
            return JWT.create()
                    .withSubject(walletAddress)
                    .withIssuedAt(now)
                    .withExpiresAt(expiryDate)
                    .withClaim("wallet", walletAddress)
                    .sign(algorithm);
        } catch (Exception e) {
            logger.error("Failed to create JWT token", e);
            return null;
        }
    }
    
    /**
     * Verify a JWT token and extract the wallet address
     * 
     * @param token JWT token
     * @return Wallet address if valid, null if invalid
     */
    public static String verifyJwtToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(getJwtSecret());
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT jwt = verifier.verify(token);
            
            return jwt.getClaim("wallet").asString();
        } catch (JWTVerificationException e) {
            logger.error("JWT verification failed", e);
            return null;
        }
    }
    
    /**
     * Extract JWT token from Authorization header
     * 
     * @param authHeader Authentication header value
     * @return JWT token or null if not present
     */
    public static String extractTokenFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        return authHeader.substring(7); // Remove "Bearer " prefix
    }
    
    /**
     * Generate a nonce for signature challenge
     * 
     * @return Random nonce string
     */
    public static String generateNonce() {
        return Long.toString(System.currentTimeMillis()) + "-" + Math.round(Math.random() * 1000000);
    }
    
    /**
     * Verify Ethereum signature to authenticate a wallet
     * 
     * @param message Original message that was signed
     * @param signature Ethereum signature (hex string)
     * @param walletAddress Expected wallet address
     * @return true if signature is valid, false otherwise
     */
    public static boolean verifySignature(String message, String signature, String walletAddress) {
        try {
            if (message == null || signature == null || walletAddress == null) {
                logger.warn("Missing parameters for signature verification");
                return false;
            }
            
            // Format wallet address for comparison
            String formattedWalletAddress = walletAddress.toLowerCase();
            if (formattedWalletAddress.startsWith("0x")) {
                formattedWalletAddress = formattedWalletAddress.substring(2);
            }
            
            // Format signature
            if (!signature.startsWith("0x")) {
                signature = "0x" + signature;
            }
            
            // Get the prefixed message hash (Ethereum standard)
            byte[] messageBytes = getPrefixedMessageBytes(message);
            byte[] messageHash = Hash.sha3(messageBytes);
            
            // Split the signature components
            byte[] signatureBytes = Numeric.hexStringToByteArray(signature);
            byte v = signatureBytes[64];
            if (v < 27) {
                v += 27;
            }
            byte[] r = Arrays.copyOfRange(signatureBytes, 0, 32);
            byte[] s = Arrays.copyOfRange(signatureBytes, 32, 64);
            
            // Create ECDSASignature object
            ECDSASignature ecdsaSignature = new ECDSASignature(
                    new BigInteger(1, r),
                    new BigInteger(1, s)
            );
            
            // Recover the public key
            BigInteger recoveredPublicKey = Sign.recoverFromSignature(
                    v - 27,
                    ecdsaSignature,
                    messageHash
            );
            
            if (recoveredPublicKey == null) {
                logger.warn("Failed to recover public key from signature");
                return false;
            }
            
            // Derive the address from the public key
            String recoveredAddress = Keys.getAddress(recoveredPublicKey).toLowerCase();
            
            // Compare addresses
            boolean isValid = recoveredAddress.equalsIgnoreCase(formattedWalletAddress);
            logger.info("Signature verification result for wallet {}: {}", 
                    walletAddress, isValid ? "VALID" : "INVALID");
            
            return isValid;
        } catch (Exception e) {
            logger.error("Signature verification failed", e);
            return false;
        }
    }
    
    /**
     * Get standard Ethereum prefix message bytes
     * 
     * @param message Original message
     * @return Prefixed message bytes according to EIP-191
     */
    private static byte[] getPrefixedMessageBytes(String message) {
        String prefix = "\\x19Ethereum Signed Message:\\n" + message.length();
        return (prefix + message).getBytes();
    }
    
    /**
     * Generate a standard authentication message for a wallet
     * 
     * @param nonce Unique nonce to prevent replay attacks
     * @return Authentication message
     */
    public static String generateAuthenticationMessage(String nonce) {
        return AUTHENTICATION_MESSAGE_PREFIX + nonce;
    }
    
    /**
     * Get JWT secret from environment or use a default for development
     * 
     * @return JWT secret key
     */
    private static String getJwtSecret() {
        if (JWT_SECRET == null || JWT_SECRET.isEmpty()) {
            logger.warn("JWT_SECRET not set in environment, using default (unsafe for production)");
            return "web3-streaming-development-jwt-secret-key";
        }
        return JWT_SECRET;
    }
    
    /**
     * Validate a token and extract user claims
     * 
     * @param authHeader Authorization header value
     * @return Map of claims or empty map if invalid
     */
    public static Map<String, String> validateToken(String authHeader) {
        Map<String, String> claims = new HashMap<>();
        
        String token = extractTokenFromHeader(authHeader);
        if (token == null) {
            return claims;
        }
        
        String walletAddress = verifyJwtToken(token);
        if (walletAddress != null) {
            claims.put("wallet", walletAddress);
        }
        
        return claims;
    }
}