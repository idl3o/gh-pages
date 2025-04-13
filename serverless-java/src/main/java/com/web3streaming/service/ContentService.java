package com.web3streaming.service;

import com.web3streaming.models.ContentItem;
import com.web3streaming.utils.DynamoDbManager;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Service for content operations such as creating, retrieving, and managing streaming content.
 */
public class ContentService {

    private static final Logger logger = LogManager.getLogger(ContentService.class);
    private static final String CONTENT_TABLE_NAME = "web3streaming-content";

    private final DynamoDbManager dynamoDbManager;
    private final DynamoDbTable<ContentItem> contentTable;

    /**
     * Constructor initializes DynamoDB connections
     */
    public ContentService() {
        this.dynamoDbManager = DynamoDbManager.getInstance();
        DynamoDbEnhancedClient enhancedClient = dynamoDbManager.getEnhancedClient();
        this.contentTable = enhancedClient.table(CONTENT_TABLE_NAME, TableSchema.fromBean(ContentItem.class));
    }

    /**
     * Create a new content item
     * 
     * @param contentItem Content item to create
     * @return The created content item with assigned ID
     */
    public ContentItem createContent(ContentItem contentItem) {
        logger.info("Creating new content: {}", contentItem.getName());
        
        try {
            // Assign a UUID if none provided
            if (contentItem.getId() == null || contentItem.getId().isEmpty()) {
                contentItem.setId(UUID.randomUUID().toString());
            }
            
            // Set timestamps
            Date now = new Date();
            contentItem.setCreatedAt(now);
            contentItem.setUpdatedAt(now);
            
            // Save to DynamoDB
            contentTable.putItem(contentItem);
            
            return contentItem;
        } catch (Exception e) {
            logger.error("Error creating content", e);
            throw e;
        }
    }
    
    /**
     * Get content by ID
     * 
     * @param contentId ID of the content to retrieve
     * @return Optional containing the content if found
     */
    public Optional<ContentItem> getContentById(String contentId) {
        logger.info("Retrieving content by ID: {}", contentId);
        
        try {
            Key key = Key.builder().partitionValue(contentId).build();
            ContentItem item = contentTable.getItem(key);
            return Optional.ofNullable(item);
        } catch (Exception e) {
            logger.error("Error retrieving content by ID: {}", contentId, e);
            return Optional.empty();
        }
    }
    
    /**
     * Get content items created by a specific creator
     * 
     * @param creatorAddress Blockchain address of the creator
     * @param limit Maximum number of items to return
     * @param lastEvaluatedKey Last evaluated key for pagination
     * @return Map containing content items and pagination info
     */
    public Map<String, Object> getContentByCreator(String creatorAddress, int limit, Map<String, AttributeValue> lastEvaluatedKey) {
        logger.info("Retrieving content by creator: {}", creatorAddress);
        
        Map<String, Object> result = new HashMap<>();
        List<ContentItem> items = new ArrayList<>();
        
        try {
            // In a production implementation, we would use a GSI on creatorAddress
            // For this simplified implementation, we'll scan and filter
            
            // Mock implementation - returned fixed list for creator
            // In a real implementation, we would query a GSI on creatorAddress
            if (creatorAddress != null && !creatorAddress.isEmpty()) {
                ContentItem item1 = new ContentItem();
                item1.setId("content-" + UUID.randomUUID().toString());
                item1.setName("Demo Content 1 for " + creatorAddress);
                item1.setContentType("video/mp4");
                item1.setCreatorAddress(creatorAddress);
                item1.setPremium(false);
                item1.setCreatedAt(new Date());
                
                ContentItem item2 = new ContentItem();
                item2.setId("content-" + UUID.randomUUID().toString());
                item2.setName("Premium Content for " + creatorAddress);
                item2.setContentType("video/mp4");
                item2.setCreatorAddress(creatorAddress);
                item2.setPremium(true);
                item2.setCreatedAt(new Date());
                
                items.add(item1);
                items.add(item2);
            }
            
            result.put("items", items);
            result.put("count", items.size());
            result.put("lastEvaluatedKey", null);  // No pagination in mock implementation
            
            return result;
        } catch (Exception e) {
            logger.error("Error retrieving content by creator", e);
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    /**
     * Update an existing content item
     * 
     * @param contentId ID of the content to update
     * @param updates Map of fields to update
     * @return Updated content item
     */
    public Optional<ContentItem> updateContent(String contentId, Map<String, Object> updates) {
        logger.info("Updating content: {}", contentId);
        
        try {
            // Retrieve the current item
            Optional<ContentItem> optionalContent = getContentById(contentId);
            
            if (optionalContent.isEmpty()) {
                logger.warn("Content not found for update: {}", contentId);
                return Optional.empty();
            }
            
            ContentItem content = optionalContent.get();
            
            // Apply updates
            if (updates.containsKey("name")) {
                content.setName((String) updates.get("name"));
            }
            
            if (updates.containsKey("description")) {
                content.setDescription((String) updates.get("description"));
            }
            
            if (updates.containsKey("ipfsCid")) {
                content.setIpfsCid((String) updates.get("ipfsCid"));
            }
            
            if (updates.containsKey("transactionHash")) {
                content.setTransactionHash((String) updates.get("transactionHash"));
            }
            
            if (updates.containsKey("premium")) {
                content.setPremium((Boolean) updates.get("premium"));
            }
            
            if (updates.containsKey("accessToken")) {
                content.setAccessToken((String) updates.get("accessToken"));
            }
            
            // Update timestamp
            content.setUpdatedAt(new Date());
            
            // Save to DynamoDB
            contentTable.updateItem(content);
            
            return Optional.of(content);
        } catch (Exception e) {
            logger.error("Error updating content", e);
            return Optional.empty();
        }
    }
    
    /**
     * Delete content by ID
     * 
     * @param contentId ID of the content to delete
     * @param creatorAddress Address of the creator requesting deletion
     * @return true if deleted successfully, false otherwise
     */
    public boolean deleteContent(String contentId, String creatorAddress) {
        logger.info("Deleting content: {}, requested by: {}", contentId, creatorAddress);
        
        try {
            // Retrieve the current item
            Optional<ContentItem> optionalContent = getContentById(contentId);
            
            if (optionalContent.isEmpty()) {
                logger.warn("Content not found for deletion: {}", contentId);
                return false;
            }
            
            ContentItem content = optionalContent.get();
            
            // Verify ownership
            if (!content.getCreatorAddress().equalsIgnoreCase(creatorAddress)) {
                logger.warn("Unauthorized deletion attempt. Creator: {}, Requester: {}", 
                        content.getCreatorAddress(), creatorAddress);
                return false;
            }
            
            // Delete from DynamoDB
            Key key = Key.builder().partitionValue(contentId).build();
            contentTable.deleteItem(key);
            
            return true;
        } catch (Exception e) {
            logger.error("Error deleting content", e);
            return false;
        }
    }
    
    /**
     * Search content by various criteria
     * 
     * @param searchParams Map of search parameters
     * @param limit Maximum number of items to return
     * @param lastEvaluatedKey Last evaluated key for pagination
     * @return Map containing search results and pagination info
     */
    public Map<String, Object> searchContent(Map<String, Object> searchParams, int limit, Map<String, AttributeValue> lastEvaluatedKey) {
        logger.info("Searching content with params: {}", searchParams);
        
        Map<String, Object> result = new HashMap<>();
        List<ContentItem> items = new ArrayList<>();
        
        try {
            // In a real implementation, we would query DynamoDB with appropriate filters
            // For this simplified implementation, we'll return mock data
            
            // Create mock content items
            for (int i = 0; i < Math.min(limit, 5); i++) {
                ContentItem item = new ContentItem();
                item.setId("search-result-" + UUID.randomUUID().toString());
                item.setName("Search Result " + (i + 1));
                item.setContentType("video/mp4");
                item.setCreatorAddress("0xabcdef1234567890abcdef1234567890abcdef12");
                item.setPremium(i % 2 == 0);  // Every other item is premium
                item.setCreatedAt(new Date());
                
                items.add(item);
            }
            
            result.put("items", items);
            result.put("count", items.size());
            result.put("lastEvaluatedKey", null);  // No pagination in mock implementation
            
            return result;
        } catch (Exception e) {
            logger.error("Error searching content", e);
            result.put("error", e.getMessage());
            return result;
        }
    }
}