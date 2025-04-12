/**
 * Content Controller Tests
 */

const ContentController = require('../../controllers/content-controller');
const ContentModel = require('../../models/content-model');
const UserModel = require('../../models/user-model');

// Mock dependencies
jest.mock('../../models/content-model');
jest.mock('../../models/user-model');

describe('ContentController', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    ContentModel.getContent.mockImplementation((contentId) => ({
      id: contentId,
      title: 'Test Content',
      description: 'Test Description',
      creatorId: 'user-123',
      contentType: 'video',
      url: 'ipfs://test-hash',
      status: 'published',
      createdAt: new Date().toISOString()
    }));
    
    ContentModel.listContent.mockImplementation(() => [
      { id: 'content-1', title: 'Content 1', creatorId: 'user-123' },
      { id: 'content-2', title: 'Content 2', creatorId: 'user-123' }
    ]);
    
    UserModel.validateSession.mockImplementation(() => ({
      id: 'user-123',
      walletAddress: '0xabc123',
      role: 'creator'
    }));
  });
  
  test('should get content by ID successfully', async () => {
    const contentId = 'content-123';
    const authToken = 'valid-token';
    
    const result = await ContentController.getContent(contentId, authToken);
    
    expect(result.success).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.content.id).toBe(contentId);
    expect(ContentModel.getContent).toHaveBeenCalledWith(contentId);
    expect(UserModel.validateSession).toHaveBeenCalledWith(authToken);
  });
  
  test('should fail to get content with invalid auth token', async () => {
    const contentId = 'content-123';
    const authToken = 'invalid-token';
    
    UserModel.validateSession.mockImplementation(() => null);
    
    const result = await ContentController.getContent(contentId, authToken);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('authentication');
  });
  
  test('should list content for creator', async () => {
    const authToken = 'valid-token';
    const filters = { creatorId: 'user-123' };
    
    const result = await ContentController.listContent(filters, authToken);
    
    expect(result.success).toBe(true);
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content.length).toBe(2);
    expect(ContentModel.listContent).toHaveBeenCalledWith(filters);
  });
  
  test('should publish content successfully', async () => {
    const authToken = 'valid-token';
    const contentData = {
      title: 'New Content',
      description: 'New Description',
      contentType: 'video',
      url: 'ipfs://new-hash'
    };
    
    ContentModel.createContent.mockImplementation((data) => ({
      id: 'new-content-id',
      ...data,
      creatorId: 'user-123',
      status: 'published',
      createdAt: new Date().toISOString()
    }));
    
    const result = await ContentController.publishContent(contentData, authToken);
    
    expect(result.success).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.content.title).toBe(contentData.title);
    expect(result.content.creatorId).toBe('user-123');
    expect(ContentModel.createContent).toHaveBeenCalledWith(expect.objectContaining({
      creatorId: 'user-123',
      title: contentData.title
    }));
  });
  
  test('should fail to publish with missing required fields', async () => {
    const authToken = 'valid-token';
    const contentData = {
      // Missing title
      description: 'New Description',
      contentType: 'video'
      // Missing url
    };
    
    const result = await ContentController.publishContent(contentData, authToken);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('required fields');
    expect(ContentModel.createContent).not.toHaveBeenCalled();
  });
});