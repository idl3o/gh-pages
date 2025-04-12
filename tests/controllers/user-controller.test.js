/**
 * User Controller Tests
 */

const UserController = require('../../controllers/user-controller');
const UserModel = require('../../models/user-model');
const BetaController = require('../../controllers/beta-controller');

// Mock dependencies
jest.mock('../../models/user-model');
jest.mock('../../controllers/beta-controller');

describe('UserController', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    UserModel.createOrUpdateUser.mockImplementation(userData => ({
      id: 'user-123',
      ...userData,
      createdAt: new Date().toISOString()
    }));
    
    UserModel.createSession.mockImplementation(walletAddress => 
      `mock-token-${walletAddress.substring(0, 8)}`
    );
    
    BetaController.betaUsers = new Map();
    BetaController.isFeatureEnabled.mockImplementation(() => false);
  });
  
  test('should initialize successfully', async () => {
    await UserController.initialize();
    expect(UserController.initialized).toBe(true);
  });
  
  test('should register a new user successfully', async () => {
    const userData = {
      walletAddress: '0xabc123',
      name: 'Test User',
      email: 'test@example.com'
    };
    
    const result = await UserController.register(userData);
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.walletAddress).toBe(userData.walletAddress);
    expect(UserModel.createOrUpdateUser).toHaveBeenCalledWith(userData);
    expect(result.token).toBe(`mock-token-${userData.walletAddress.substring(0, 8)}`);
  });
  
  test('should fail registration without wallet address', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    const result = await UserController.register(userData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Wallet address is required');
    expect(UserModel.createOrUpdateUser).not.toHaveBeenCalled();
  });
  
  test('should authenticate with wallet successfully', async () => {
    const mockUser = {
      id: 'user-123',
      walletAddress: '0xabc123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'viewer'
    };
    
    UserModel.getUserByWallet.mockImplementation(() => mockUser);
    
    const authData = {
      walletAddress: '0xabc123',
      signature: 'valid-signature'
    };
    
    const result = await UserController.authenticateWallet(authData);
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.walletAddress).toBe(authData.walletAddress);
    expect(result.token).toBeDefined();
  });
});