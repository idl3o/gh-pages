package com.web3streaming.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.web3streaming.models.ErrorResponse;
import com.web3streaming.services.TokenService;
import com.web3streaming.util.AuthValidator;
import com.web3streaming.util.ResponseBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

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
 * AWS Lambda handler for token verification and blockchain token operations.
 */
public class TokenHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger logger = LogManager.getLogger(TokenHandler.class);
    private final Gson gson = new Gson();
    private final TokenService tokenService;
    private final AuthValidator authValidator;

    public TokenHandler() {
        this.tokenService = new TokenService();
        this.authValidator = new AuthValidator();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        logger.info("Processing token request: {}", request);
        
        try {
            // Token verification might need authentication
            Optional<String> authError = authValidator.validateToken(request.getHeaders());
            if (authError.isPresent()) {
                return ResponseBuilder.unauthorized(
                        new ErrorResponse("Unauthorized", authError.get()));
            }

            // Extract path and HTTP method
            String path = request.getPath();
            String httpMethod = request.getHttpMethod();
            
            // Route to appropriate method based on path and HTTP method
            if (httpMethod.equalsIgnoreCase("GET")) {
                if (path.matches("/api/token/balance/.*")) {
                    return getTokenBalance(request);
                } else if (path.matches("/api/token/verify/.*")) {
                    return verifyTokenOwnership(request);
                } else if (path.equals("/api/token/supported")) {
                    return getSupportedTokens(request);
                }
            } else if (httpMethod.equalsIgnoreCase("POST")) {
                if (path.equals("/api/token/verify")) {
                    return verifyTokenMessage(request);
                }
            }
            
            // Path not found
            return ResponseBuilder.notFound(
                    new ErrorResponse("Not Found", "Resource not found: " + path));
            
        } catch (Exception e) {
            logger.error("Error processing token request", e);
            return ResponseBuilder.serverError(
                    new ErrorResponse("Server Error", "Internal server error occurred"));
        }
    }
    
    /**
     * Get token balance for a wallet address.
     */
    private APIGatewayProxyResponseEvent getTokenBalance(APIGatewayProxyRequestEvent request) {
        String path = request.getPath();
        String[] segments = path.split("/");
        
        if (segments.length < 5) {
            return ResponseBuilder.badRequest(
                    new ErrorResponse("Bad Request", "Invalid path format. Expected: /api/token/balance/{tokenAddress}/{walletAddress}"));
        }
        
        String tokenAddress = segments[segments.length - 2];
        String walletAddress = segments[segments.length - 1];
        
        try {
            String balance = tokenService.getTokenBalance(tokenAddress, walletAddress);
            Map<String, String> response = new HashMap<>();
            response.put("tokenAddress", tokenAddress);
            response.put("walletAddress", walletAddress);
            response.put("balance", balance);
            
            return ResponseBuilder.ok(response);
        } catch (Exception e) {
            logger.error("Error getting token balance", e);
            return ResponseBuilder.serverError(
                    new ErrorResponse("Token Error", "Error retrieving token balance: " + e.getMessage()));
        }
    }
    
    /**
     * Verify token ownership for a wallet address.
     */
    private APIGatewayProxyResponseEvent verifyTokenOwnership(APIGatewayProxyRequestEvent request) {
        String path = request.getPath();
        String[] segments = path.split("/");
        
        if (segments.length < 5) {
            return ResponseBuilder.badRequest(
                    new ErrorResponse("Bad Request", "Invalid path format. Expected: /api/token/verify/{tokenAddress}/{walletAddress}"));
        }
        
        String tokenAddress = segments[segments.length - 2];
        String walletAddress = segments[segments.length - 1];
        
        try {
            boolean hasTokens = tokenService.verifyTokenOwnership(tokenAddress, walletAddress);
            Map<String, Object> response = new HashMap<>();
            response.put("tokenAddress", tokenAddress);
            response.put("walletAddress", walletAddress);
            response.put("hasTokens", hasTokens);
            
            return ResponseBuilder.ok(response);
        } catch (Exception e) {
            logger.error("Error verifying token ownership", e);
            return ResponseBuilder.serverError(
                    new ErrorResponse("Token Error", "Error verifying token ownership: " + e.getMessage()));
        }
    }
    
    /**
     * Get list of supported tokens.
     */
    private APIGatewayProxyResponseEvent getSupportedTokens(APIGatewayProxyRequestEvent request) {
        try {
            return ResponseBuilder.ok(tokenService.getSupportedTokens());
        } catch (Exception e) {
            logger.error("Error getting supported tokens", e);
            return ResponseBuilder.serverError(
                    new ErrorResponse("Token Error", "Error retrieving supported tokens: " + e.getMessage()));
        }
    }
    
    /**
     * Verify signed message for token authentication.
     */
    private APIGatewayProxyResponseEvent verifyTokenMessage(APIGatewayProxyRequestEvent request) {
        try {
            Map<String, Object> body = gson.fromJson(request.getBody(), Map.class);
            
            if (!body.containsKey("walletAddress") || !body.containsKey("message") || !body.containsKey("signature")) {
                return ResponseBuilder.badRequest(
                        new ErrorResponse("Bad Request", "Required fields: walletAddress, message, signature"));
            }
            
            String walletAddress = (String) body.get("walletAddress");
            String message = (String) body.get("message");
            String signature = (String) body.get("signature");
            
            boolean isValid = tokenService.verifySignedMessage(walletAddress, message, signature);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", isValid);
            return ResponseBuilder.ok(response);
        } catch (Exception e) {
            logger.error("Error verifying token message", e);
            return ResponseBuilder.serverError(
                    new ErrorResponse("Token Error", "Error verifying message: " + e.getMessage()));
        }
    }
}