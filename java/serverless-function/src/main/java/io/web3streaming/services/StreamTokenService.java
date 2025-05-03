package io.web3streaming.services;

import io.web3streaming.contracts.StreamToken;
import io.web3streaming.exceptions.Web3StreamingException;
import io.web3streaming.utils.Web3jProvider;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;

public class StreamTokenService {
    private final Web3j web3j;
    private final Credentials credentials;
    private final String tokenContractAddress;

    public StreamTokenService(String contractAddress) {
        this.web3j = Web3jProvider.getWeb3j();
        this.credentials = Web3jProvider.getCredentials();
        this.tokenContractAddress = contractAddress;
    }

    public BigInteger getBalance(String address) throws Web3StreamingException {
        try {
            StreamToken contract = StreamToken.load(
                tokenContractAddress,
                web3j,
                credentials,
                new DefaultGasProvider()
            );
            return contract.balanceOf(address).send();
        } catch (Exception e) {
            throw new Web3StreamingException("Failed to retrieve token balance", e);
        }
    }

    public boolean transfer(String to, BigInteger amount) throws Web3StreamingException {
        try {
            StreamToken contract = StreamToken.load(
                tokenContractAddress,
                web3j,
                credentials,
                new DefaultGasProvider()
            );
            return contract.transfer(to, amount).send().isStatusOK();
        } catch (Exception e) {
            throw new Web3StreamingException("Failed to transfer tokens", e);
        }
    }

    // Additional token operations
}
