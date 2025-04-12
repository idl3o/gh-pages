# API Reference

This document provides detailed information about the endpoints available in our Web3 Streaming Platform API.

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Content](#content)
4. [Payments](#payments)
5. [NFTs](#nfts)
6. [Analytics](#analytics)

## Authentication

### Connect Wallet

Authenticate a user with a blockchain wallet.

```
POST /api/auth/wallet
```

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "signature": "0x456..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-value",
  "user": {
    "id": "user-123",
    "walletAddress": "0x123...",
    "name": "User Name",
    "role": "creator"
  }
}
```

### Sign In with Email

Authenticate a user with email and password.

```
POST /api/auth/email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-value",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "viewer"
  }
}
```

### Sign Out

Invalidate the current session.

```
POST /api/auth/signout
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully signed out"
}
```

## Users

### Get Current User

Get details of the authenticated user.

```
GET /api/users/me
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "User Name",
    "email": "user@example.com",
    "walletAddress": "0x123...",
    "role": "creator",
    "profileImage": "https://example.com/image.jpg",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### Update User Profile

Update the authenticated user's profile.

```
PUT /api/users/me
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "profileImage": "https://example.com/new-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "Updated Name",
    "profileImage": "https://example.com/new-image.jpg"
  }
}
```

## Content

### List Content

List content with optional filters.

```
GET /api/content
```

**Query Parameters:**
```
creatorId (optional): Filter by creator ID
contentType (optional): Filter by content type (video, audio, etc.)
page (optional): Page number for pagination
limit (optional): Number of items per page
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "content": [
    {
      "id": "content-123",
      "title": "Example Video",
      "description": "This is an example video",
      "contentType": "video",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "creatorId": "user-123",
      "creatorName": "Creator Name",
      "createdAt": "2023-01-01T00:00:00Z",
      "viewCount": 1000,
      "hasNft": true
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Get Content

Get a specific content item by ID.

```
GET /api/content/:id
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "content": {
    "id": "content-123",
    "title": "Example Video",
    "description": "This is an example video",
    "contentType": "video",
    "url": "ipfs://QmHash",
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "creatorId": "user-123",
    "creatorName": "Creator Name",
    "createdAt": "2023-01-01T00:00:00Z",
    "viewCount": 1000,
    "commentCount": 50,
    "likeCount": 200,
    "tags": ["crypto", "blockchain", "web3"],
    "nftTokenId": "1234",
    "nftContractAddress": "0xcontract"
  }
}
```

### Publish Content

Create a new content item.

```
POST /api/content
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Request Body:**
```json
{
  "title": "New Video",
  "description": "This is a new video",
  "contentType": "video",
  "url": "ipfs://QmHash",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "tags": ["crypto", "blockchain"],
  "tokenGating": {
    "enabled": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": {
    "id": "content-456",
    "title": "New Video",
    "createdAt": "2023-06-01T00:00:00Z"
  }
}
```

### Update Content

Update an existing content item.

```
PUT /api/content/:id
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "content": {
    "id": "content-123",
    "title": "Updated Title",
    "description": "Updated description"
  }
}
```

### Delete Content

Delete a content item.

```
DELETE /api/content/:id
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

## Payments

### Process Payment

Process a payment for content access.

```
POST /api/payments
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Request Body:**
```json
{
  "contentId": "content-123",
  "amount": "0.01",
  "currency": "ETH"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment-123",
  "transactionHash": "0x789...",
  "status": "completed"
}
```

### Get Payment History

Get the payment history for the authenticated user.

```
GET /api/payments/history
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "payment-123",
      "contentId": "content-123",
      "contentTitle": "Example Video",
      "amount": "0.01",
      "currency": "ETH",
      "transactionHash": "0x789...",
      "timestamp": "2023-05-01T00:00:00Z",
      "status": "completed"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

## NFTs

### Mint Content NFT

Convert content to an NFT.

```
POST /api/nft/mint
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Request Body:**
```json
{
  "contentId": "content-123",
  "name": "Example NFT",
  "description": "NFT description",
  "image": "https://example.com/nft-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "tokenId": "1234",
  "transactionHash": "0xabc...",
  "contractAddress": "0xcontract",
  "metadata": "ipfs://metadata/content-123"
}
```

### Check Content Ownership

Check if a user owns a specific content NFT.

```
GET /api/nft/ownership/:contentId
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "isOwner": true,
  "tokenId": "1234",
  "contractAddress": "0xcontract"
}
```

### Get Owned NFTs

Get all NFTs owned by the authenticated user.

```
GET /api/nft/owned
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "totalBalance": 5,
  "ownedNFTs": [
    {
      "tokenId": "1234",
      "contentId": "content-123",
      "title": "Example Video",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "contentType": "video",
      "contractAddress": "0xcontract",
      "metadataUri": "ipfs://metadata/content-123"
    }
  ]
}
```

### Check Token Gated Access

Check if a user has access to token-gated content.

```
GET /api/nft/access/:contentId
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "hasAccess": true,
  "reason": "NFT holder"
}
```

## Analytics

### Get Content Analytics

Get analytics for a specific content item.

```
GET /api/analytics/content/:id
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Query Parameters:**
```
timeframe (optional): daily, weekly, monthly, all
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "viewCount": 1000,
    "uniqueViewers": 800,
    "averageWatchTime": 120,
    "completionRate": 0.75,
    "revenue": {
      "total": "0.5",
      "currency": "ETH"
    },
    "timeSeriesData": [
      {
        "date": "2023-06-01",
        "views": 100,
        "uniqueViewers": 80,
        "revenue": "0.05"
      }
    ],
    "demographics": {
      "geoDistribution": [
        { "country": "USA", "percentage": 40 },
        { "country": "UK", "percentage": 20 }
      ]
    }
  }
}
```

### Get Creator Analytics

Get analytics for all content of the authenticated creator.

```
GET /api/analytics/creator
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Query Parameters:**
```
timeframe (optional): daily, weekly, monthly, all
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalViews": 50000,
    "totalUniqueViewers": 30000,
    "totalRevenue": {
      "amount": "10.5",
      "currency": "ETH"
    },
    "contentCount": 25,
    "subscriberCount": 5000,
    "topContent": [
      {
        "id": "content-123",
        "title": "Popular Video",
        "viewCount": 5000,
        "revenue": "2.5"
      }
    ],
    "growthRate": {
      "views": 0.15,
      "subscribers": 0.08,
      "revenue": 0.20
    }
  }
}
```

### Get Platform Analytics

Get platform-wide analytics (admin only).

```
GET /api/analytics/platform
```

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "userCount": 10000,
    "creatorCount": 500,
    "contentCount": 5000,
    "totalViews": 1000000,
    "totalRevenue": {
      "amount": "100.5",
      "currency": "ETH"
    },
    "activeDau": 2000,
    "activeMau": 8000,
    "retention": 0.65,
    "conversionRate": 0.08
  }
}
```