package io.web3streaming.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

public class Web3jProvider {
    private static final Logger logger = LoggerFactory.getLogger(Web3jProvider.class);
    private static Web3j web3j;

    private Web3jProvider() {
        // Private constructor to prevent instantiation
    }

    public static synchronized Web3j getWeb3j() {
        if (web3j == null) {
            String providerUrl = System.getenv("WEB3_PROVIDER_URL");
            if (providerUrl == null || providerUrl.isEmpty()) {
                logger.warn("WEB3_PROVIDER_URL environment variable not set, using default Infura endpoint");
                providerUrl = "https://mainnet.infura.io/v3/your-default-key";
            }

            logger.info("Initializing Web3j with provider URL: {}", providerUrl);
            web3j = Web3j.build(new HttpService(providerUrl));
        }
        return web3j;
    }
}
