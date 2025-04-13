package com.web3streaming.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

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
 * Utility class for validating authentication tokens.
 */
public class AuthValidator {
    
    private static final Logger logger = LogManager.getLogger(AuthValidator.class);
    private static final String AUTH_HEADER = "Authorization";
    private static final String AUTH_TYPE = "Bearer ";
    
    // JWT secret from environment variable or parameter store
    private final String jwtSecret;
    
    public AuthValidator() {
        // In production, load from AWS Parameter Store or similar secure storage
        this.jwtSecret = System.getenv("JWT_SECRET");
        if (this.jwtSecret == null || this.jwtSecret.isEmpty()) {
            logger.warn("JWT_SECRET environment variable not set. Using default secret for development only!");
        }
    }
    
    /**
     * Validate an authorization token from request headers.
     * 
     * @param headers HTTP request headers
     * @return Optional with error message if invalid, empty if valid
     */
    public Optional<String> validateToken(Map<String, String> headers) {
        // Check if Authorization header exists
        if (headers == null || !headers.containsKey(AUTH_HEADER)) {
            return Optional.of("Authorization header is missing");
        }
        
        String authHeader = headers.get(AUTH_HEADER);
        
        // Check if it's a Bearer token
        if (authHeader == null || !authHeader.startsWith(AUTH_TYPE)) {
            return Optional.of("Invalid authorization format. Expected: Bearer <token>");
        }
        
        // Extract token
        String token = authHeader.substring(AUTH_TYPE.length());
        
        try {
            // Verify JWT signature and structure
            String secret = jwtSecret != null ? jwtSecret : "dev-only-secret-replace-in-production";
            Algorithm algorithm = Algorithm.HMAC256(secret);
            
            DecodedJWT jwt = JWT.require(algorithm)
                    .withIssuer("web3-streaming-service")
                    .build()
                    .verify(token);
            
            // Token is valid if we get here
            return Optional.empty();
            
        } catch (JWTVerificationException e) {
            logger.warn("Invalid JWT token: {}", e.getMessage());
            return Optional.of("Invalid or expired token");
        }
    }
    
    /**
     * Extract wallet address from a valid JWT token.
     * 
     * @param headers HTTP request headers
     * @return Optional containing wallet address if available, empty otherwise
     */
    public Optional<String> extractWalletAddress(Map<String, String> headers) {
        if (validateToken(headers).isPresent()) {
            return Optional.empty();
        }
        
        try {
            String token = headers.get(AUTH_HEADER).substring(AUTH_TYPE.length());
            DecodedJWT jwt = JWT.decode(token);
            return Optional.ofNullable(jwt.getClaim("walletAddress").asString());
        } catch (Exception e) {
            logger.error("Error extracting wallet address from token", e);
            return Optional.empty();
        }
    }
}