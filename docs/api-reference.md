# API Reference

This document provides comprehensive documentation for the Web3 Streaming Platform APIs.

## REST API

The platform provides REST APIs via Netlify Functions for interacting with content, users, and blockchain data.

### Base URL

```
https://yoursite.netlify.app/.netlify/functions/
```

For local development:

```
http://localhost:8888/.netlify/functions/
```

### Authentication

Most API endpoints require authentication. Use one of the following methods:

**Bearer Token** (preferred):

```
Authorization: Bearer <your-jwt-token>
```

**API Key** (for development):

```
X-API-Key: <your-api-key>
```

### Content API

#### Get Content

Retrieves content metadata by ID.

```
GET /api-handler/content/:contentId
```

**Parameters:**

- `contentId` (path): Unique identifier for the content

**Response:**

```json
{
  "id": "content-123",
  "title": "Introduction to Web3",
  "description": "Learn about Web3 technologies",
  "creator": "0x1234567890123456789012345678901234567890",
  "createdAt": "2025-04-28T12:30:45Z",
  "contentType": "video/mp4",
  "duration": 360,
  "thumbnailUrl": "ipfs://QmThumbnailCID",
  "contentUrl": "ipfs://QmContentCID",
  "accessType": "public",
  "tags": ["web3", "blockchain", "tutorial"]
}
```

#### List Content

Retrieves a paginated list of content.

```
GET /api-handler/content
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `creator` (optional): Filter by creator address
- `tags` (optional): Filter by tags (comma-separated)
- `accessType` (optional): Filter by access type (public, token-gated)

**Response:**

```json
{
  "items": [
    {
      "id": "content-123",
      "title": "Introduction to Web3",
      "description": "Learn about Web3 technologies",
      "creator": "0x1234567890123456789012345678901234567890",
      "createdAt": "2025-04-28T12:30:45Z",
      "contentType": "video/mp4",
      "duration": 360,
      "thumbnailUrl": "ipfs://QmThumbnailCID",
      "accessType": "public",
      "tags": ["web3", "blockchain", "tutorial"]
    }
    // More items...
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Create Content

Uploads new content to the platform.

```
POST /api-handler/content
```

**Request Body:**

```json
{
  "title": "My Web3 Tutorial",
  "description": "A comprehensive guide to Web3",
  "contentType": "video/mp4",
  "accessType": "public",
  "tags": ["web3", "blockchain", "tutorial"],
  "file": "Base64EncodedFileData" // For small files
}
```

For larger files, use the `/upload` endpoint with multipart/form-data.

**Response:**

```json
{
  "id": "content-124",
  "title": "My Web3 Tutorial",
  "status": "processing",
  "uploadUrl": "https://example.com/upload/content-124"
}
```

#### Update Content

Updates existing content metadata.

```
PUT /api-handler/content/:contentId
```

**Parameters:**

- `contentId` (path): Content ID to update

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["updated", "tags"]
}
```

**Response:**

```json
{
  "id": "content-123",
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "updatedAt": "2025-04-29T10:15:30Z"
}
```

#### Delete Content

Removes content from the platform.

```
DELETE /api-handler/content/:contentId
```

**Parameters:**

- `contentId` (path): Content ID to delete

**Response:**

```json
{
  "id": "content-123",
  "status": "deleted"
}
```

### User API

#### Get Current User

Retrieves the authenticated user's information.

```
GET /api-handler/user
```

**Response:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "username": "web3user",
  "profileImage": "ipfs://QmProfileImageCID",
  "createdAt": "2025-01-15T08:20:10Z",
  "contentCount": 12,
  "verified": true
}
```

#### Update User Profile

Updates the user's profile information.

```
PUT /api-handler/user
```

**Request Body:**

```json
{
  "username": "newusername",
  "profileImage": "ipfs://QmNewProfileImageCID",
  "bio": "Web3 content creator and blockchain enthusiast"
}
```

**Response:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "username": "newusername",
  "profileImage": "ipfs://QmNewProfileImageCID",
  "bio": "Web3 content creator and blockchain enthusiast",
  "updatedAt": "2025-04-29T11:20:35Z"
}
```

### Authentication API

#### Connect Wallet

Authenticates a user via their blockchain wallet.

```
POST /api-handler/auth/connect
```

**Request Body:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "signature": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "message": "Sign this message to authenticate with Web3 Streaming Platform: nonce=123456"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "address": "0x1234567890123456789012345678901234567890",
    "username": "web3user"
  }
}
```

#### Get Authentication Challenge

Gets a challenge message for wallet authentication.

```
GET /api-handler/auth/challenge?address=0x1234567890123456789012345678901234567890
```

**Parameters:**

- `address` (query): Wallet address requesting authentication

**Response:**

```json
{
  "message": "Sign this message to authenticate with Web3 Streaming Platform: nonce=123456",
  "nonce": "123456"
}
```

### Blockchain API

#### Get Token Balance

Retrieves the user's token balance.

```
GET /api-handler/blockchain/balance
```

**Response:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "balance": "1250000000000000000000",
  "formattedBalance": "1250",
  "symbol": "PRX",
  "decimals": 18
}
```

#### Get Transaction History

Gets the user's transaction history.

```
GET /api-handler/blockchain/transactions
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "items": [
    {
      "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "type": "contentPurchase",
      "amount": "50000000000000000000",
      "formattedAmount": "50",
      "timestamp": "2025-04-27T14:30:20Z",
      "contentId": "content-123",
      "status": "confirmed"
    }
    // More transactions...
  ],
  "pagination": {
    "total": 35,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

## WebSocket API

For real-time updates, the platform provides a WebSocket API.

### Connection

```javascript
const socket = new WebSocket('wss://yoursite.netlify.app/.netlify/functions/websocket');

// Authentication
socket.onopen = () => {
  socket.send(
    JSON.stringify({
      type: 'authenticate',
      token: 'your-jwt-token'
    })
  );
};
```

### Event Types

#### Content Update

```javascript
socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);

  if (data.type === 'content.update') {
    console.log('Content updated:', data.content);
  }
});
```

#### Transaction Event

```javascript
socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);

  if (data.type === 'transaction') {
    console.log('Transaction:', data.transaction);
  }
});
```

## TypeScript SDK API

For client-side applications, the TypeScript SDK provides a convenient wrapper around the REST and WebSocket APIs.

### Installation

```bash
npm install @web3streaming/sdk
```

### Usage

```typescript
import { PRXBlockchainClient } from '@web3streaming/sdk';

const client = new PRXBlockchainClient({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Connect to wallet
await client.connect();

// Get content
const content = await client.getContent('content-123');

// Upload content
const result = await client.uploadContent({
  title: 'My Content',
  file: fileObject
});

// Subscribe to events
client.on('content.update', content => {
  console.log('Content updated:', content);
});
```

See the [TypeScript SDK Documentation](/ts/README.md) for more details.

## Error Codes

| Code | Description                                                             |
| ---- | ----------------------------------------------------------------------- |
| 400  | Bad Request - The request was malformed or missing required parameters. |
| 401  | Unauthorized - Authentication is required or failed.                    |
| 403  | Forbidden - The authenticated user lacks permission for this action.    |
| 404  | Not Found - The requested resource does not exist.                      |
| 409  | Conflict - The request conflicts with the current state.                |
| 429  | Too Many Requests - Rate limit exceeded.                                |
| 500  | Internal Server Error - An unexpected error occurred on the server.     |

## Rate Limits

API endpoints are rate-limited to prevent abuse:

- Authentication endpoints: 10 requests per minute
- Content retrieval: 60 requests per minute
- Content creation: 10 requests per minute
- User profile updates: 5 requests per minute

When a rate limit is exceeded, the API returns a 429 status code with a Retry-After header indicating the seconds to wait before retrying.
