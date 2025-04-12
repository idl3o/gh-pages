/**
 * Web3 Integration Tests
 * These tests validate the Web3 utilities against mock blockchain interactions
 */

const Web3Utils = require('../../assets/js/web3-utils');
const { Web3 } = require('web3');

// Mock Web3 provider
jest.mock('web3', () => {
  const mockWeb3 = {
    eth: {
      getAccounts: jest.fn(),
      getChainId: jest.fn(),
      getGasPrice: jest.fn(),
      getBlockNumber: jest.fn(),
      getBalance: jest.fn(),
      personal: {
        sign: jest.fn()
      },
      Contract: jest.fn()
    },
    utils: {
      fromWei: jest.fn(),
      toWei: jest.fn()
    }
  };
  
  return { 
    Web3: jest.fn(() => mockWeb3) 
  };
});

describe('Web3 Integration Tests', () => {
  let web3;
  
  beforeEach(() => {
    // Reset the mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    web3 = new Web3();
    web3.eth.getAccounts.mockResolvedValue(['0x123456789abcdef']);
    web3.eth.getChainId.mockResolvedValue('1');
    web3.eth.getGasPrice.mockResolvedValue('20000000000');
    web3.eth.getBlockNumber.mockResolvedValue(15000000);
    web3.eth.getBalance.mockResolvedValue('1000000000000000000');
    web3.eth.personal.sign.mockResolvedValue('0xsignature');
    web3.utils.fromWei.mockImplementation((value, unit) => {
      if (unit === 'gwei') return '20';
      return '1';
    });
    web3.utils.toWei.mockImplementation((value) => '1000000000000000000');
    
    // Mock window.ethereum for browser environment
    global.window = {
      ethereum: {
        request: jest.fn().mockResolvedValue(['0x123456789abcdef'])
      }
    };
  });
  
  afterEach(() => {
    delete global.window;
  });
  
  test('connectWallet should request accounts and return first account', async () => {
    // Mock function implementation to validate it's properly called
    jest.spyOn(Web3Utils, 'getWeb3Instance').mockResolvedValue(web3);
    
    const account = await Web3Utils.connectWallet();
    
    expect(account).toBe('0x123456789abcdef');
    expect(window.ethereum.request).toHaveBeenCalledWith({ 
      method: 'eth_requestAccounts' 
    });
    expect(web3.eth.getAccounts).toHaveBeenCalled();
  });
  
  test('signMessage should call personal.sign', async () => {
    jest.spyOn(Web3Utils, 'getWeb3Instance').mockResolvedValue(web3);
    const address = '0x123456789abcdef';
    const message = 'Test message';
    
    const signature = await Web3Utils.signMessage(address, message);
    
    expect(signature).toBe('0xsignature');
    expect(web3.eth.personal.sign).toHaveBeenCalledWith(
      message, 
      address
    );
  });
  
  test('getBalance should return balance in ETH', async () => {
    jest.spyOn(Web3Utils, 'getWeb3Instance').mockResolvedValue(web3);
    const address = '0x123456789abcdef';
    
    const balance = await Web3Utils.getBalance(address);
    
    expect(balance).toBe('1');
    expect(web3.eth.getBalance).toHaveBeenCalledWith(address);
    expect(web3.utils.fromWei).toHaveBeenCalled();
  });
  
  test('getNetworkInfo should return network information', async () => {
    jest.spyOn(Web3Utils, 'getWeb3Instance').mockResolvedValue(web3);
    
    const networkInfo = await Web3Utils.getNetworkInfo();
    
    expect(networkInfo).toEqual({
      id: '1',
      name: 'Ethereum Mainnet'
    });
    expect(web3.eth.getChainId).toHaveBeenCalled();
  });
  
  test('getGasPrice should return gas price in different units', async () => {
    jest.spyOn(Web3Utils, 'getWeb3Instance').mockResolvedValue(web3);
    
    const gasInfo = await Web3Utils.getGasPrice();
    
    expect(gasInfo).toEqual({
      wei: '20000000000',
      gwei: '20',
      eth: '1'
    });
    expect(web3.eth.getGasPrice).toHaveBeenCalled();
    expect(web3.utils.fromWei).toHaveBeenCalledTimes(2);
  });
  
  test('getContract should return contract instance', async () => {
    jest.spyOn(Web3Utils, 'getWeb3Instance').mockResolvedValue(web3);
    const contractAddress = '0xcontractaddress';
    const abi = [{ type: 'function', name: 'testMethod', inputs: [] }];
    
    await Web3Utils.getContract(contractAddress, abi);
    
    expect(web3.eth.Contract).toHaveBeenCalledWith(abi, {
      address: contractAddress
    });
  });
});