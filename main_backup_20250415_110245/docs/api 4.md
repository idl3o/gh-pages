- --
layout: default
title: API Documentation
description: Complete API reference for Web3 Crypto Streaming Service
permalink: /docs/api/
- --

# API Documentation

Our RESTful API provides developers with programmatic access to the Web3 Crypto Streaming Service platform. This documentation covers the endpoints, request formats, and response structures.

## Authentication

All API requests require authentication using JWT tokens. To obtain a token:

```
POST /api/auth/token
```

* *Request body:**
```json
{
  "wallet_address": "0x1234...",
  "signature": "0xabcd..."
}
```

* *Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

## Endpoints

### Content

#### List Content

```
GET /api/content
```

Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `creator`: Filter by creator address
- `tags`: Filter by tags (comma separated)

#### Get Content

```
GET /api/content/{id}
```

#### Create Content

```
POST /api/content
```

### Streams

#### List Active Streams

```
GET /api/streams
```

#### Get Stream Details

```
GET /api/streams/{id}
```

#### Create Stream

```
POST /api/streams
```

### Subscriptions

#### List User Subscriptions

```
GET /api/subscriptions
```

#### Create Subscription

```
POST /api/subscriptions
```

## Error Codes

Our API uses conventional HTTP response codes to indicate the success or failure of requests:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limits

API calls are limited to 100 requests per minute per authenticated user. Exceeding this limit will result in a 429 response.

