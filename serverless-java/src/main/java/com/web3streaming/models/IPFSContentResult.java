package com.web3streaming.models;

import java.io.Serializable;
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
 * Model representing the result of an IPFS content operation.
 */
public class IPFSContentResult implements Serializable {
    
    // Content identifier in IPFS
    private String cid;
    
    // Name of the content
    private String name;
    
    // MIME type of the content
    private String contentType;
    
    // Size of content in bytes
    private long size;
    
    // Whether the content is pinned in IPFS
    private boolean pinned;
    
    // IPFS gateway URL
    private String gateway;
    
    // Additional metadata
    private Map<String, Object> metadata;

    public IPFSContentResult() {
        this.metadata = new HashMap<>();
    }

    public IPFSContentResult(String cid) {
        this.cid = cid;
        this.metadata = new HashMap<>();
    }

    public String getCid() {
        return cid;
    }

    public void setCid(String cid) {
        this.cid = cid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
    
    /**
     * Get the full gateway URL to access this content
     * 
     * @return Full URL to access the content via IPFS gateway
     */
    public String getGatewayUrl() {
        if (gateway == null || gateway.isEmpty() || cid == null || cid.isEmpty()) {
            return null;
        }
        
        String baseUrl = gateway.endsWith("/") ? gateway : gateway + "/";
        return baseUrl + "ipfs/" + cid;
    }
}