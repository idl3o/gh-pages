package com.web3streaming.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
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
 * Service for interacting with IPFS and Pinata for content storage.
 */
public class IPFSService {

    private static final Logger logger = LogManager.getLogger(IPFSService.class);
    private final HttpClient httpClient;
    private final String pinataApiKey;
    private final String pinataSecretKey;
    private final String ipfsGatewayUrl;

    /**
     * Constructor initializes HTTP client and loads API keys
     */
    public IPFSService() {
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        
        // In production, get these from environment variables or AWS Parameter Store
        this.pinataApiKey = System.getenv("PINATA_API_KEY");
        this.pinataSecretKey = System.getenv("PINATA_SECRET_KEY");
        this.ipfsGatewayUrl = System.getenv().getOrDefault("IPFS_GATEWAY_URL", "https://gateway.pinata.cloud/ipfs/");
    }

    /**
     * Pin content to IPFS using Pinata
     * 
     * @param contentData Base64 encoded content data
     * @param metadata Metadata for the content
     * @return Map with the IPFS CID and gateway URL
     * @throws IOException If there's an error during the HTTP request
     * @throws InterruptedException If the HTTP request is interrupted
     */
    public Map<String, String> pinContent(String contentData, Map<String, String> metadata) 
            throws IOException, InterruptedException {
        logger.info("Pinning content to IPFS with metadata: {}", metadata);
        
        if (pinataApiKey == null || pinataSecretKey == null) {
            logger.error("Pinata API keys not configured");
            throw new IllegalStateException("Pinata API keys not configured");
        }
        
        try {
            // Build the request body
            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("data", contentData);
            
            JsonObject pinataMetadata = new JsonObject();
            pinataMetadata.addProperty("name", metadata.getOrDefault("name", "Web3StreamingContent"));
            
            JsonObject keyValues = new JsonObject();
            for (Map.Entry<String, String> entry : metadata.entrySet()) {
                keyValues.addProperty(entry.getKey(), entry.getValue());
            }
            pinataMetadata.add("keyvalues", keyValues);
            requestBody.add("pinataMetadata", pinataMetadata);
            
            JsonObject pinataOptions = new JsonObject();
            pinataOptions.addProperty("cidVersion", 1);
            requestBody.add("pinataOptions", pinataOptions);
            
            // Build the HTTP request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.pinata.cloud/pinning/pinJSONToIPFS"))
                    .header("Content-Type", "application/json")
                    .header("pinata_api_key", pinataApiKey)
                    .header("pinata_secret_api_key", pinataSecretKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();
            
            // Send the request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // Parse the response
                JsonObject jsonResponse = JsonParser.parseString(response.body()).getAsJsonObject();
                String ipfsCid = jsonResponse.get("IpfsHash").getAsString();
                
                Map<String, String> result = new HashMap<>();
                result.put("cid", ipfsCid);
                result.put("url", ipfsGatewayUrl + ipfsCid);
                
                logger.info("Successfully pinned content to IPFS. CID: {}", ipfsCid);
                return result;
            } else {
                logger.error("Error pinning content to IPFS: {}", response.body());
                throw new IOException("Error pinning content to IPFS: " + response.body());
            }
        } catch (Exception e) {
            logger.error("Exception pinning content to IPFS", e);
            throw e;
        }
    }
    
    /**
     * Pin metadata JSON to IPFS using Pinata
     * 
     * @param metadata Map of metadata key-value pairs
     * @return Map with the IPFS CID and gateway URL
     * @throws IOException If there's an error during the HTTP request
     * @throws InterruptedException If the HTTP request is interrupted
     */
    public Map<String, String> pinMetadata(Map<String, Object> metadata) 
            throws IOException, InterruptedException {
        logger.info("Pinning metadata to IPFS: {}", metadata);
        
        if (pinataApiKey == null || pinataSecretKey == null) {
            logger.error("Pinata API keys not configured");
            throw new IllegalStateException("Pinata API keys not configured");
        }
        
        try {
            // Build the request body
            JsonObject requestBody = new JsonObject();
            
            // Convert metadata map to JSON object
            for (Map.Entry<String, Object> entry : metadata.entrySet()) {
                if (entry.getValue() instanceof String) {
                    requestBody.addProperty(entry.getKey(), (String) entry.getValue());
                } else if (entry.getValue() instanceof Number) {
                    requestBody.addProperty(entry.getKey(), (Number) entry.getValue());
                } else if (entry.getValue() instanceof Boolean) {
                    requestBody.addProperty(entry.getKey(), (Boolean) entry.getValue());
                } else {
                    requestBody.addProperty(entry.getKey(), String.valueOf(entry.getValue()));
                }
            }
            
            JsonObject pinataMetadata = new JsonObject();
            pinataMetadata.addProperty("name", metadata.getOrDefault("name", "Web3StreamingMetadata").toString());
            requestBody.add("pinataMetadata", pinataMetadata);
            
            JsonObject pinataOptions = new JsonObject();
            pinataOptions.addProperty("cidVersion", 1);
            requestBody.add("pinataOptions", pinataOptions);
            
            // Build the HTTP request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.pinata.cloud/pinning/pinJSONToIPFS"))
                    .header("Content-Type", "application/json")
                    .header("pinata_api_key", pinataApiKey)
                    .header("pinata_secret_api_key", pinataSecretKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();
            
            // Send the request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // Parse the response
                JsonObject jsonResponse = JsonParser.parseString(response.body()).getAsJsonObject();
                String ipfsCid = jsonResponse.get("IpfsHash").getAsString();
                
                Map<String, String> result = new HashMap<>();
                result.put("cid", ipfsCid);
                result.put("url", ipfsGatewayUrl + ipfsCid);
                
                logger.info("Successfully pinned metadata to IPFS. CID: {}", ipfsCid);
                return result;
            } else {
                logger.error("Error pinning metadata to IPFS: {}", response.body());
                throw new IOException("Error pinning metadata to IPFS: " + response.body());
            }
        } catch (Exception e) {
            logger.error("Exception pinning metadata to IPFS", e);
            throw e;
        }
    }
    
    /**
     * Retrieve content from IPFS
     * 
     * @param cid IPFS CID of the content
     * @return The retrieved content as a string
     * @throws IOException If there's an error during the HTTP request
     * @throws InterruptedException If the HTTP request is interrupted
     */
    public String retrieveContent(String cid) throws IOException, InterruptedException {
        logger.info("Retrieving content from IPFS with CID: {}", cid);
        
        try {
            // Build the HTTP request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ipfsGatewayUrl + cid))
                    .GET()
                    .build();
            
            // Send the request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                logger.info("Successfully retrieved content from IPFS");
                return response.body();
            } else {
                logger.error("Error retrieving content from IPFS: {}", response.body());
                throw new IOException("Error retrieving content from IPFS: " + response.statusCode());
            }
        } catch (Exception e) {
            logger.error("Exception retrieving content from IPFS", e);
            throw e;
        }
    }
    
    /**
     * Unpin content from IPFS
     * 
     * @param cid IPFS CID of the content to unpin
     * @return true if successful, false otherwise
     * @throws IOException If there's an error during the HTTP request
     * @throws InterruptedException If the HTTP request is interrupted
     */
    public boolean unpinContent(String cid) throws IOException, InterruptedException {
        logger.info("Unpinning content from IPFS with CID: {}", cid);
        
        if (pinataApiKey == null || pinataSecretKey == null) {
            logger.error("Pinata API keys not configured");
            throw new IllegalStateException("Pinata API keys not configured");
        }
        
        try {
            // Build the HTTP request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.pinata.cloud/pinning/unpin/" + cid))
                    .header("pinata_api_key", pinataApiKey)
                    .header("pinata_secret_api_key", pinataSecretKey)
                    .DELETE()
                    .build();
            
            // Send the request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                logger.info("Successfully unpinned content from IPFS");
                return true;
            } else {
                logger.error("Error unpinning content from IPFS: {}", response.body());
                return false;
            }
        } catch (Exception e) {
            logger.error("Exception unpinning content from IPFS", e);
            throw e;
        }
    }
}