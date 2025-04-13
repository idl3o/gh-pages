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
 * Model for an IPFS content upload request.
 */
public class IPFSContentRequest implements Serializable {
    
    // Base64 encoded data to upload
    private String data;
    
    // MIME type of the content
    private String mimeType;
    
    // Optional metadata to associate with the content
    private Map<String, Object> metadata;

    public IPFSContentRequest() {
        this.metadata = new HashMap<>();
    }

    public IPFSContentRequest(String data, String mimeType, Map<String, Object> metadata) {
        this.data = data;
        this.mimeType = mimeType;
        this.metadata = metadata;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}