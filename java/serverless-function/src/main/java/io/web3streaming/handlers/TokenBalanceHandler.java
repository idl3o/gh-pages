package io.web3streaming.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.web3streaming.services.StreamTokenService;
import io.web3streaming.utils.Web3jProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.Map;

public class TokenBalanceHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger logger = LoggerFactory.getLogger(TokenBalanceHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StreamTokenService tokenService;

    public TokenBalanceHandler() {
        this.tokenService = new StreamTokenService(Web3jProvider.getWeb3j());
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        logger.info("Received request to get token balance");

        String address = input.getPathParameters().get("address");

        if (address == null || address.isEmpty()) {
            return buildResponse(400, "Missing address parameter");
        }

        try {
            // Validate address format
            if (!address.startsWith("0x") || address.length() != 42) {
                return buildResponse(400, "Invalid Ethereum address format");
            }

            BigInteger balance = tokenService.getTokenBalance(address);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("address", address);
            responseBody.put("balance", balance);

            return buildResponse(200, responseBody);
        } catch (Exception e) {
            logger.error("Error retrieving token balance", e);
            return buildResponse(500, "Error retrieving token balance: " + e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent buildResponse(int statusCode, Object bodyObject) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);

        try {
            response.setBody(objectMapper.writeValueAsString(bodyObject));
        } catch (JsonProcessingException e) {
            logger.error("Error serializing response", e);
            response.setStatusCode(500);
            response.setBody("{\"error\": \"Error serializing response\"}");
        }

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        response.setHeaders(headers);

        return response;
    }
}
