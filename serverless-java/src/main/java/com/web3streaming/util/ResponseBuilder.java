package com.web3streaming.util;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.web3streaming.models.ErrorResponse;

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
 * Utility class for building standardized API responses.
 */
public class ResponseBuilder {
    
    private static final Gson gson = new Gson();
    
    /**
     * Build a successful (200 OK) response with a given body.
     * 
     * @param body Object to serialize as response
     * @return APIGatewayProxyResponseEvent with 200 status and JSON body
     */
    public static APIGatewayProxyResponseEvent ok(Object body) {
        return buildResponse(200, body);
    }
    
    /**
     * Build a created (201) response with a given body.
     * 
     * @param body Object to serialize as response
     * @return APIGatewayProxyResponseEvent with 201 status and JSON body
     */
    public static APIGatewayProxyResponseEvent created(Object body) {
        return buildResponse(201, body);
    }
    
    /**
     * Build a no content (204) response.
     * 
     * @return APIGatewayProxyResponseEvent with 204 status
     */
    public static APIGatewayProxyResponseEvent noContent() {
        return buildResponse(204, null);
    }
    
    /**
     * Build a bad request (400) response with an error body.
     * 
     * @param errorResponse Error details
     * @return APIGatewayProxyResponseEvent with 400 status and error body
     */
    public static APIGatewayProxyResponseEvent badRequest(ErrorResponse errorResponse) {
        errorResponse.setStatus(400);
        return buildResponse(400, errorResponse);
    }
    
    /**
     * Build an unauthorized (401) response with an error body.
     * 
     * @param errorResponse Error details
     * @return APIGatewayProxyResponseEvent with 401 status and error body
     */
    public static APIGatewayProxyResponseEvent unauthorized(ErrorResponse errorResponse) {
        errorResponse.setStatus(401);
        return buildResponse(401, errorResponse);
    }
    
    /**
     * Build a forbidden (403) response with an error body.
     * 
     * @param errorResponse Error details
     * @return APIGatewayProxyResponseEvent with 403 status and error body
     */
    public static APIGatewayProxyResponseEvent forbidden(ErrorResponse errorResponse) {
        errorResponse.setStatus(403);
        return buildResponse(403, errorResponse);
    }
    
    /**
     * Build a not found (404) response with an error body.
     * 
     * @param errorResponse Error details
     * @return APIGatewayProxyResponseEvent with 404 status and error body
     */
    public static APIGatewayProxyResponseEvent notFound(ErrorResponse errorResponse) {
        errorResponse.setStatus(404);
        return buildResponse(404, errorResponse);
    }
    
    /**
     * Build a server error (500) response with an error body.
     * 
     * @param errorResponse Error details
     * @return APIGatewayProxyResponseEvent with 500 status and error body
     */
    public static APIGatewayProxyResponseEvent serverError(ErrorResponse errorResponse) {
        errorResponse.setStatus(500);
        return buildResponse(500, errorResponse);
    }
    
    /**
     * Build a binary response for file downloads.
     * 
     * @param body The binary data
     * @param contentType MIME type of the content
     * @return APIGatewayProxyResponseEvent configured for binary response
     */
    public static APIGatewayProxyResponseEvent binary(byte[] body, String contentType) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", contentType);
        headers.put("Cache-Control", "max-age=86400");
        
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(headers)
                .withBody(Base64.getEncoder().encodeToString(body))
                .withIsBase64Encoded(true);
    }
    
    /**
     * Build a custom response with the given status code and body.
     * 
     * @param statusCode HTTP status code
     * @param body Object to serialize as response
     * @return APIGatewayProxyResponseEvent with specified status and body
     */
    private static APIGatewayProxyResponseEvent buildResponse(int statusCode, Object body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key");
        headers.put("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
        
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(headers);
        
        if (body != null) {
            response.withBody(gson.toJson(body));
        }
        
        return response;
    }
}