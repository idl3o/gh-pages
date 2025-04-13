package com.web3streaming.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.web3streaming.models.ErrorResponse;
import com.web3streaming.models.IPFSContentRequest;
import com.web3streaming.models.IPFSContentResult;
import com.web3streaming.service.IPFSService;
import com.web3streaming.util.AuthValidator;
import com.web3streaming.util.ResponseBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.util.Base64;
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
 * Handler for IPFS-related API endpoints.
 */
public class IPFSHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static final Logger logger = LogManager.getLogger(IPFSHandler.class);
    private static final Gson gson = new Gson();
    
    private final IPFSService ipfsService = new IPFSService();
    private final AuthValidator authValidator = new AuthValidator();
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        String path = request.getPath();
        String method = request.getHttpMethod();
        Map<String, String> headers = request.getHeaders();
        
        try {
            // Most IPFS operations require authentication
            if (!"/api/v1/ipfs/status".equals(path)) {
                Optional<String> validationError = authValidator.validateToken(headers);
                if (validationError.isPresent()) {
                    return ResponseBuilder.unauthorized(new ErrorResponse("Authorization failed", validationError.get()));
                }
            }
            
            if ("/api/v1/ipfs/upload".equals(path) && "POST".equals(method)) {
                return handleUpload(request);
                
            } else if ("/api/v1/ipfs/pin".equals(path) && "POST".equals(method)) {
                return handlePin(request);
                
            } else if (path.matches("/api/v1/ipfs/content/[^/]+") && "GET".equals(method)) {
                String cid = path.substring("/api/v1/ipfs/content/".length());
                return handleGetContent(cid, request);
                
            } else if ("/api/v1/ipfs/status".equals(path) && "GET".equals(method)) {
                return handleGetStatus();
                
            } else if (path.matches("/api/v1/ipfs/metadata/[^/]+") && "GET".equals(method)) {
                String cid = path.substring("/api/v1/ipfs/metadata/".length());
                return handleGetMetadata(cid);
            }
            
            return ResponseBuilder.badRequest(new ErrorResponse("Invalid request", "Method not supported for this endpoint"));
        } catch (Exception e) {
            logger.error("Error handling IPFS request", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    private APIGatewayProxyResponseEvent handleUpload(APIGatewayProxyRequestEvent request) {
        logger.info("Handling IPFS upload request");
        
        try {
            IPFSContentRequest contentRequest = gson.fromJson(request.getBody(), IPFSContentRequest.class);
            
            if (contentRequest.getData() == null || contentRequest.getData().isEmpty()) {
                return ResponseBuilder.badRequest(new ErrorResponse("Invalid request", "Content data is required"));
            }
            
            // Decode the Base64 content
            byte[] data = Base64.getDecoder().decode(contentRequest.getData());
            
            // Set a default MIME type if not provided
            String mimeType = contentRequest.getMimeType();
            if (mimeType == null || mimeType.isEmpty()) {
                mimeType = "application/octet-stream";
            }
            
            // Upload to IPFS
            IPFSContentResult result = ipfsService.uploadContent(data, mimeType, contentRequest.getMetadata());
            
            return ResponseBuilder.created(result);
        } catch (IOException e) {
            logger.error("Error uploading content to IPFS", e);
            return ResponseBuilder.serverError(new ErrorResponse("IPFS Upload Error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error processing upload request", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    private APIGatewayProxyResponseEvent handlePin(APIGatewayProxyRequestEvent request) {
        logger.info("Handling IPFS pin request");
        
        try {
            Map<String, String> requestBody = gson.fromJson(
                request.getBody(),
                new TypeToken<Map<String, String>>(){}.getType()
            );
            
            String cid = requestBody.get("cid");
            if (cid == null || cid.isEmpty()) {
                return ResponseBuilder.badRequest(new ErrorResponse("Invalid request", "CID is required"));
            }
            
            IPFSContentResult result = ipfsService.pinContent(cid);
            return ResponseBuilder.ok(result);
        } catch (IOException e) {
            logger.error("Error pinning content in IPFS", e);
            return ResponseBuilder.serverError(new ErrorResponse("IPFS Pin Error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error processing pin request", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    private APIGatewayProxyResponseEvent handleGetContent(String cid, APIGatewayProxyRequestEvent request) {
        logger.info("Handling IPFS content retrieval request for CID: {}", cid);
        
        try {
            // Get content from IPFS
            byte[] content = ipfsService.getContent(cid);
            
            // Get content type
            String contentType = ipfsService.getContentType(cid);
            
            // Return binary response
            return ResponseBuilder.binary(content, contentType);
        } catch (IOException e) {
            logger.error("Error retrieving content from IPFS", e);
            return ResponseBuilder.serverError(new ErrorResponse("IPFS Retrieval Error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error retrieving content", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    private APIGatewayProxyResponseEvent handleGetStatus() {
        logger.info("Handling IPFS status request");
        
        try {
            Map<String, Object> status = ipfsService.getIPFSServiceStatus();
            return ResponseBuilder.ok(status);
        } catch (Exception e) {
            logger.error("Error getting IPFS status", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
    
    private APIGatewayProxyResponseEvent handleGetMetadata(String cid) {
        logger.info("Handling IPFS metadata request for CID: {}", cid);
        
        try {
            Map<String, Object> metadata = ipfsService.getContentMetadata(cid);
            
            if (metadata == null || metadata.isEmpty()) {
                return ResponseBuilder.notFound(new ErrorResponse("Not found", "No metadata found for the specified CID"));
            }
            
            return ResponseBuilder.ok(metadata);
        } catch (Exception e) {
            logger.error("Error retrieving metadata", e);
            return ResponseBuilder.serverError(new ErrorResponse("Server error", e.getMessage()));
        }
    }
}