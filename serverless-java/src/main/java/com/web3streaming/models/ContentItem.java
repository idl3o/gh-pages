package com.web3streaming.models;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.io.Serializable;
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
 * Model representing a content item in the Web3 Streaming platform.
 */
@DynamoDbBean
public class ContentItem implements Serializable {
    
    // Unique identifier for the content
    private String id;
    
    // Title of the content
    private String title;
    
    // Description of the content
    private String description;
    
    // Type of content (video, audio, image, etc.)
    private String contentType;
    
    // Wallet address of the content creator
    private String creatorAddress;
    
    // IPFS CID for the content
    private String contentCid;
    
    // IPFS CID for the thumbnail
    private String thumbnailCid;
    
    // Duration of content in seconds (for audio/video)
    private Integer duration;
    
    // Size of content in bytes
    private Long size;
    
    // Access control - 'public', 'token', 'subscription'
    private String accessType;
    
    // Required token address for access (if applicable)
    private String requiredTokenAddress;
    
    // Status - 'draft', 'published', 'archived'
    private String status;
    
    // Tags for content discovery
    private String[] tags;
    
    // Additional metadata
    private Map<String, Object> metadata;
    
    // Timestamps
    private Date createdAt;
    private Date updatedAt;
    private Date publishedAt;

    public ContentItem() {
        this.metadata = new HashMap<>();
        this.status = "draft";
        this.accessType = "public";
    }

    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getCreatorAddress() {
        return creatorAddress;
    }

    public void setCreatorAddress(String creatorAddress) {
        this.creatorAddress = creatorAddress;
    }

    public String getContentCid() {
        return contentCid;
    }

    public void setContentCid(String contentCid) {
        this.contentCid = contentCid;
    }

    public String getThumbnailCid() {
        return thumbnailCid;
    }

    public void setThumbnailCid(String thumbnailCid) {
        this.thumbnailCid = thumbnailCid;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getAccessType() {
        return accessType;
    }

    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }

    public String getRequiredTokenAddress() {
        return requiredTokenAddress;
    }

    public void setRequiredTokenAddress(String requiredTokenAddress) {
        this.requiredTokenAddress = requiredTokenAddress;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String[] getTags() {
        return tags;
    }

    public void setTags(String[] tags) {
        this.tags = tags;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Date getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Date publishedAt) {
        this.publishedAt = publishedAt;
    }
}