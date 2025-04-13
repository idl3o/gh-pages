package com.web3streaming.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.web3streaming.models.ErrorResponse;
import com.web3streaming.util.ResponseBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Map;
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
 * Main handler for API Gateway events in the Web3 Streaming Service.
 * Routes requests to appropriate handlers based on the path.
 */
public class ApiGatewayHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger logger = LogManager.getLogger(ApiGatewayHandler.class);
    private static final Gson gson = new Gson();
    
    // Handler instances
    private final ContentHandler contentHandler = new ContentHandler();
    private final UserHandler userHandler = new UserHandler();
    private final TokenHandler tokenHandler = new TokenHandler();
    private final IPFSHandler ipfsHandler = new IPFSHandler();
    private final VerificationHandler verificationHandler = new VerificationHandler();
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        logger.info("Received request: {}", request.getPath());
        
        try {
            String path = request.getPath();
            String httpMethod = request.getHttpMethod();
            
            // Route to appropriate handler based on path
            if (path.matches("/api/v1/content.*")) {
                return contentHandler.handleRequest(request, context);
            } else if (path.matches("/api/v1/users.*")) {
                return userHandler.handleRequest(request, context);
            } else if (path.matches("/api/v1/tokens.*")) {
                return tokenHandler.handleRequest(request, context);
            } else if (path.matches("/api/v1/ipfs.*")) {
                return ipfsHandler.handleRequest(request, context);
            } else if (path.matches("/api/v1/verify.*")) {
                return verificationHandler.handleRequest(request, context);
            }
            
            // Handle health check endpoint
            if ("/health".equals(path) && "GET".equals(httpMethod)) {
                return ResponseBuilder.ok(Map.of(
                    "status", "UP",
                    "service", "Web3 Streaming Serverless API",
                    "version", "1.2.0"
                ));
            }
            
            return ResponseBuilder.notFound(new ErrorResponse("Resource not found", "The requested endpoint does not exist"));
        } catch (Exception e) {
            logger.error("Error handling request", e);
            return ResponseBuilder.serverError(new ErrorResponse("Internal server error", e.getMessage()));
        }
    }
}