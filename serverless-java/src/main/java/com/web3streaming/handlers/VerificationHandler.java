package com.web3streaming.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.web3streaming.models.ErrorResponse;
import com.web3streaming.service.VerificationService;
import com.web3streaming.util.AuthValidator;
import com.web3streaming.util.ResponseBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Handler for content verification operations such as checking integrity,
 * validating on-chain records, and confirming creator identity.
 */
public class VerificationHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger logger = LogManager.getLogger(VerificationHandler.class);
    private static final Gson gson = new Gson();
    private static final Pattern CONTENT_ID_PATTERN = Pattern.compile("/api/v1/verify/content/([^/]+)");
    
    private final VerificationService verificationService = new VerificationService();
    private final AuthValidator authValidator = new AuthValidator();
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        String path = request.getPath();
        String method = request.getHttpMethod();
        Map<String, String> headers = request.getHeaders();
        
        try {
            // Content verification endpoints are public
            if (path.startsWith("/api/v1/verify/content/") && "GET".equals(method)) {
                Matcher matcher = CONTENT_ID_PATTERN.matcher(path);
                if (matcher.matches()) {
                    String contentId = matcher.group(1);
                    return handleVerifyContent(contentId, request);
                }
            } 
            // Other verification endpoints require authentication
            else {
                Optional<String> validationError = authValidator.validateToken(headers);
                if (validationError.isPresent()) {
                    return ResponseBuilder.unauthorized(new ErrorResponse("Authorization failed", validationError.get()));
                }
                
                if ("/api/v1/verify/signature".equals(path) && "POST".equals(method)) {
                    return handleVerifySignature(request);
                } else if ("/api/v1/verify/transaction".equals(path) && "POST".equals(method)) {
                    return handleVerifyTransaction(request);
                } else if ("/api/v1/verify/creator".equals(path) && "POST".equals(method)) {
                    return handleVerifyCreator(request);
                }
            }
            
            return ResponseBuilder.notFound(new ErrorResponse("Resource not found", "The requested endpoint does not exist"));
        } catch (Exception e) {
            logger.error("Error processing verification request", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    /**
     * Handle requests to verify content integrity and status
     */
    private APIGatewayProxyResponseEvent handleVerifyContent(String contentId, APIGatewayProxyRequestEvent request) {
        try {
            Map<String, Object> verificationResult = verificationService.verifyContentIntegrity(contentId);
            return ResponseBuilder.ok(verificationResult);
        } catch (Exception e) {
            logger.error("Error verifying content integrity: {}", contentId, e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    /**
     * Handle requests to verify cryptographic signatures
     */
    private APIGatewayProxyResponseEvent handleVerifySignature(APIGatewayProxyRequestEvent request) {
        try {
            Map<String, String> requestBody = gson.fromJson(request.getBody(), Map.class);
            
            String message = requestBody.get("message");
            String signature = requestBody.get("signature");
            String address = requestBody.get("address");
            
            if (message == null || signature == null || address == null) {
                return ResponseBuilder.badRequest(
                    new ErrorResponse("Invalid request", "Message, signature, and address are required")
                );
            }
            
            boolean isValid = verificationService.verifySignature(message, signature, address);
            
            Map<String, Object> result = Map.of(
                "isValid", isValid,
                "address", address
            );
            
            return ResponseBuilder.ok(result);
        } catch (Exception e) {
            logger.error("Error verifying signature", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    /**
     * Handle requests to verify blockchain transactions
     */
    private APIGatewayProxyResponseEvent handleVerifyTransaction(APIGatewayProxyRequestEvent request) {
        try {
            Map<String, String> requestBody = gson.fromJson(request.getBody(), Map.class);
            
            String txHash = requestBody.get("transactionHash");
            String network = requestBody.get("network");
            
            if (txHash == null) {
                return ResponseBuilder.badRequest(
                    new ErrorResponse("Invalid request", "Transaction hash is required")
                );
            }
            
            // Default to Ethereum mainnet if network is not specified
            if (network == null || network.isEmpty()) {
                network = "ethereum";
            }
            
            Map<String, Object> txInfo = verificationService.verifyTransaction(txHash, network);
            return ResponseBuilder.ok(txInfo);
        } catch (Exception e) {
            logger.error("Error verifying transaction", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    /**
     * Handle requests to verify content creator identity
     */
    private APIGatewayProxyResponseEvent handleVerifyCreator(APIGatewayProxyRequestEvent request) {
        try {
            Map<String, String> requestBody = gson.fromJson(request.getBody(), Map.class);
            
            String contentId = requestBody.get("contentId");
            String creatorAddress = requestBody.get("creatorAddress");
            
            if (contentId == null || creatorAddress == null) {
                return ResponseBuilder.badRequest(
                    new ErrorResponse("Invalid request", "Content ID and creator address are required")
                );
            }
            
            boolean isCreator = verificationService.verifyContentCreator(contentId, creatorAddress);
            
            Map<String, Object> result = Map.of(
                "contentId", contentId,
                "creatorAddress", creatorAddress,
                "isCreator", isCreator
            );
            
            return ResponseBuilder.ok(result);
        } catch (Exception e) {
            logger.error("Error verifying creator", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
}