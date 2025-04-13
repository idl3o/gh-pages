package com.web3streaming.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.web3streaming.models.ContentItem;
import com.web3streaming.models.ErrorResponse;
import com.web3streaming.util.AuthValidator;
import com.web3streaming.util.ResponseBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.*;

/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * AWS Lambda handler for content operations.
 */
public class ContentHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static final Logger logger = LogManager.getLogger(ContentHandler.class);
    private static final Gson gson = new Gson();
    private static final AuthValidator authValidator = new AuthValidator();
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        logger.info("Received content request: {}", request.getPath());
        
        try {
            // CORS preflight request
            if ("OPTIONS".equals(request.getHttpMethod())) {
                return handleOptionsRequest();
            }
            
            // Extract path parameters
            String path = request.getPath();
            String[] pathParts = path.split("/");
            
            // Route the request to the appropriate handler
            if (path.startsWith("/api/content")) {
                if ("GET".equals(request.getHttpMethod())) {
                    if (pathParts.length >= 4 && !pathParts[3].isEmpty()) {
                        // GET /api/content/{id}
                        return getContentById(pathParts[3], request.getQueryStringParameters(), request.getHeaders());
                    } else {
                        // GET /api/content
                        return listContent(request.getQueryStringParameters(), request.getHeaders());
                    }
                } else if ("POST".equals(request.getHttpMethod())) {
                    // POST /api/content
                    return createContent(request.getBody(), request.getHeaders());
                } else if ("PUT".equals(request.getHttpMethod()) && pathParts.length >= 4) {
                    // PUT /api/content/{id}
                    return updateContent(pathParts[3], request.getBody(), request.getHeaders());
                } else if ("DELETE".equals(request.getHttpMethod()) && pathParts.length >= 4) {
                    // DELETE /api/content/{id}
                    return deleteContent(pathParts[3], request.getHeaders());
                }
            } else if (path.startsWith("/api/content/featured")) {
                // GET /api/content/featured
                return getFeaturedContent(request.getQueryStringParameters(), request.getHeaders());
            } else if (path.startsWith("/api/content/trending")) {
                // GET /api/content/trending
                return getTrendingContent(request.getQueryStringParameters(), request.getHeaders());
            } else if (path.startsWith("/api/content/creator")) {
                // GET /api/content/creator/{address}
                if (pathParts.length >= 5) {
                    return getContentByCreator(pathParts[4], request.getQueryStringParameters(), request.getHeaders());
                }
            }
            
            // If no route matches, return 404
            return ResponseBuilder.notFound(new ErrorResponse(
                "not_found", 
                "The requested resource was not found"
            ));
            
        } catch (Exception e) {
            logger.error("Error handling content request", e);
            return ResponseBuilder.serverError(new ErrorResponse(
                "server_error",
                "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Handles OPTIONS requests for CORS preflight
     */
    private APIGatewayProxyResponseEvent handleOptionsRequest() {
        return ResponseBuilder.ok("");
    }
    
    /**
     * Get content item by ID
     */
    private APIGatewayProxyResponseEvent getContentById(String id, Map<String, String> queryParams, Map<String, String> headers) {
        logger.info("Getting content with ID: {}", id);
        
        // This is a mock implementation - in a real app, we would fetch from DynamoDB
        ContentItem content = new ContentItem();
        content.setId(id);
        content.setTitle("Sample Web3 Content");
        content.setDescription("This is a sample content item for the Web3 Crypto Streaming Service");
        content.setContentCid("Qmf9T3j74PKPf7iJvmG4LPCFFXbJrBrSHxmTKm8tUzDvZj");
        content.setThumbnailCid("QmT9HubrJ5Lw6Jj3y9ZrT3xZfPaCvek2BZe8JGpL8v6vSj");
        content.setCreatorAddress("0x1234567890123456789012345678901234567890");
        content.setContentType("video");
        content.setCreatedAt(1712345678L);
        content.setUpdatedAt(1714321098L);
        
        return ResponseBuilder.ok(content);
    }
    
    /**
     * List content items with optional filtering
     */
    private APIGatewayProxyResponseEvent listContent(Map<String, String> queryParams, Map<String, String> headers) {
        logger.info("Listing content with filters: {}", queryParams);
        
        // This is a mock implementation - in a real app, we would fetch from DynamoDB
        List<ContentItem> contentItems = new ArrayList<>();
        
        // Mock data
        for (int i = 0; i < 5; i++) {
            ContentItem content = new ContentItem();
            content.setId("content-" + i);
            content.setTitle("Web3 Content Item " + i);
            content.setDescription("Description for content item " + i);
            content.setContentCid("Qmf9T3j74PK" + i);
            content.setThumbnailCid("QmT9HubrJ5L" + i);
            content.setCreatorAddress("0x1234567890123456789012345678901234567" + i);
            content.setContentType(i % 2 == 0 ? "video" : "audio");
            content.setCreatedAt(1712345678L + i*1000);
            contentItems.add(content);
        }
        
        // Create response object with pagination info
        Map<String, Object> response = new HashMap<>();
        response.put("items", contentItems);
        response.put("total", contentItems.size());
        response.put("page", queryParams != null && queryParams.containsKey("page") ? 
                Integer.parseInt(queryParams.get("page")) : 1);
        
        return ResponseBuilder.ok(response);
    }
    
    /**
     * Create a new content item
     */
    private APIGatewayProxyResponseEvent createContent(String body, Map<String, String> headers) {
        logger.info("Creating content: {}", body);
        
        // Validate authentication
        Optional<String> authError = authValidator.validateToken(headers);
        if (authError.isPresent()) {
            return ResponseBuilder.unauthorized(new ErrorResponse(
                "unauthorized", 
                authError.get()
            ));
        }
        
        // Get creator address from token
        String creatorAddress = authValidator.getAddressFromToken(headers);
        if (creatorAddress == null) {
            return ResponseBuilder.badRequest(new ErrorResponse(
                "invalid_token", 
                "Could not determine creator address from token"
            ));
        }
        
        try {
            // Parse request body
            JsonObject jsonObject = JsonParser.parseString(body).getAsJsonObject();
            
            // Validate required fields
            if (!jsonObject.has("title") || !jsonObject.has("contentCid")) {
                return ResponseBuilder.badRequest(new ErrorResponse(
                    "invalid_request", 
                    "Missing required fields: title and contentCid are required"
                ));
            }
            
            // Create content item (mock implementation)
            ContentItem content = gson.fromJson(body, ContentItem.class);
            content.setId(UUID.randomUUID().toString());
            content.setCreatorAddress(creatorAddress);
            content.setCreatedAt(System.currentTimeMillis() / 1000);
            content.setUpdatedAt(content.getCreatedAt());
            
            // In a real implementation, we would save to DynamoDB here
            
            return ResponseBuilder.created(content);
            
        } catch (Exception e) {
            logger.error("Error creating content", e);
            return ResponseBuilder.badRequest(new ErrorResponse(
                "invalid_request", 
                "Invalid request format: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Update an existing content item
     */
    private APIGatewayProxyResponseEvent updateContent(String id, String body, Map<String, String> headers) {
        logger.info("Updating content with ID: {}", id);
        
        // Validate authentication
        Optional<String> authError = authValidator.validateToken(headers);
        if (authError.isPresent()) {
            return ResponseBuilder.unauthorized(new ErrorResponse(
                "unauthorized", 
                authError.get()
            ));
        }
        
        // Get creator address from token
        String creatorAddress = authValidator.getAddressFromToken(headers);
        
        try {
            // In a real implementation, we would fetch the content from DynamoDB
            // and check if the user is authorized to update it
            
            // Mock content item
            ContentItem existingContent = new ContentItem();
            existingContent.setId(id);
            existingContent.setCreatorAddress("0x1234567890123456789012345678901234567890");
            
            // Check if user is authorized to update
            if (!existingContent.getCreatorAddress().equals(creatorAddress) && !authValidator.isAdmin(headers)) {
                return ResponseBuilder.forbidden(new ErrorResponse(
                    "forbidden", 
                    "You are not authorized to update this content"
                ));
            }
            
            // Parse update data
            ContentItem updatedContent = gson.fromJson(body, ContentItem.class);
            updatedContent.setId(id); // Ensure ID doesn't change
            updatedContent.setCreatorAddress(existingContent.getCreatorAddress()); // Creator can't change
            updatedContent.setUpdatedAt(System.currentTimeMillis() / 1000);
            
            // In a real implementation, we would update in DynamoDB here
            
            return ResponseBuilder.ok(updatedContent);
            
        } catch (Exception e) {
            logger.error("Error updating content", e);
            return ResponseBuilder.badRequest(new ErrorResponse(
                "invalid_request", 
                "Invalid request format: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Delete a content item
     */
    private APIGatewayProxyResponseEvent deleteContent(String id, Map<String, String> headers) {
        logger.info("Deleting content with ID: {}", id);
        
        // Validate authentication
        Optional<String> authError = authValidator.validateToken(headers);
        if (authError.isPresent()) {
            return ResponseBuilder.unauthorized(new ErrorResponse(
                "unauthorized", 
                authError.get()
            ));
        }
        
        // Get creator address from token
        String creatorAddress = authValidator.getAddressFromToken(headers);
        
        try {
            // In a real implementation, we would fetch the content from DynamoDB
            // and check if the user is authorized to delete it
            
            // Mock content item
            ContentItem existingContent = new ContentItem();
            existingContent.setId(id);
            existingContent.setCreatorAddress("0x1234567890123456789012345678901234567890");
            
            // Check if user is authorized to delete
            if (!existingContent.getCreatorAddress().equals(creatorAddress) && !authValidator.isAdmin(headers)) {
                return ResponseBuilder.forbidden(new ErrorResponse(
                    "forbidden", 
                    "You are not authorized to delete this content"
                ));
            }
            
            // In a real implementation, we would delete from DynamoDB here
            
            return ResponseBuilder.noContent();
            
        } catch (Exception e) {
            logger.error("Error deleting content", e);
            return ResponseBuilder.serverError(new ErrorResponse(
                "server_error", 
                "Error deleting content: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get featured content
     */
    private APIGatewayProxyResponseEvent getFeaturedContent(Map<String, String> queryParams, Map<String, String> headers) {
        logger.info("Getting featured content");
        
        // This is a mock implementation - in a real app, we would fetch from DynamoDB
        List<ContentItem> contentItems = new ArrayList<>();
        
        // Mock data for featured content
        for (int i = 0; i < 3; i++) {
            ContentItem content = new ContentItem();
            content.setId("featured-" + i);
            content.setTitle("Featured Web3 Content " + i);
            content.setDescription("Featured description for item " + i);
            content.setContentCid("Qmf9T3j74PK" + i);
            content.setThumbnailCid("QmT9HubrJ5L" + i);
            content.setCreatorAddress("0x1234567890123456789012345678901234567" + i);
            content.setContentType(i % 2 == 0 ? "video" : "audio");
            content.setCreatedAt(1712345678L + i*1000);
            content.setPremium(true);
            contentItems.add(content);
        }
        
        return ResponseBuilder.ok(contentItems);
    }
    
    /**
     * Get trending content
     */
    private APIGatewayProxyResponseEvent getTrendingContent(Map<String, String> queryParams, Map<String, String> headers) {
        logger.info("Getting trending content");
        
        // This is a mock implementation - in a real app, we would fetch from DynamoDB
        List<ContentItem> contentItems = new ArrayList<>();
        
        // Mock data for trending content
        for (int i = 0; i < 4; i++) {
            ContentItem content = new ContentItem();
            content.setId("trending-" + i);
            content.setTitle("Trending Web3 Content " + i);
            content.setDescription("Trending description for item " + i);
            content.setContentCid("Qmf9T3j74PK" + i);
            content.setThumbnailCid("QmT9HubrJ5L" + i);
            content.setCreatorAddress("0x9876543210987654321098765432109876543" + i);
            content.setContentType(i % 2 == 0 ? "video" : "audio");
            content.setCreatedAt(1712345678L + i*1000);
            content.setViewCount(1000 + i*200);
            contentItems.add(content);
        }
        
        return ResponseBuilder.ok(contentItems);
    }
    
    /**
     * Get content by creator address
     */
    private APIGatewayProxyResponseEvent getContentByCreator(String creatorAddress, Map<String, String> queryParams, Map<String, String> headers) {
        logger.info("Getting content by creator: {}", creatorAddress);
        
        // This is a mock implementation - in a real app, we would fetch from DynamoDB
        List<ContentItem> contentItems = new ArrayList<>();
        
        // Mock data for creator content
        for (int i = 0; i < 3; i++) {
            ContentItem content = new ContentItem();
            content.setId("creator-" + i);
            content.setTitle("Creator Content " + i);
            content.setDescription("Content by creator " + creatorAddress);
            content.setContentCid("Qmf9T3j74PK" + i);
            content.setThumbnailCid("QmT9HubrJ5L" + i);
            content.setCreatorAddress(creatorAddress);
            content.setContentType(i % 2 == 0 ? "video" : "audio");
            content.setCreatedAt(1712345678L + i*1000);
            contentItems.add(content);
        }
        
        return ResponseBuilder.ok(contentItems);
    }
}