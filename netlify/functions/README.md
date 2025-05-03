# Serverless Functions

This directory contains the serverless functions that power the Web3 Streaming Platform's API layer. These functions are deployed to Netlify and provide the backend services for various platform features.

## Overview

Our serverless functions provide scalable, on-demand processing for various platform operations. Using the serverless architecture allows us to maintain high availability while only paying for the compute resources we actually use.

## Key Functions

### api-handler.js

The main API handler function that routes requests to the appropriate service.

**Endpoints:**

- `GET /api/content`: Fetch content metadata
- `POST /api/content`: Create new content
- `GET /api/user`: Get user information
- `POST /api/auth`: Authentication endpoint

### content-api.js

Handles content-related operations including storage, retrieval, and metadata management.

### auth-api.js

Manages user authentication and authorization, including JWT issuance and validation.

### blockchain-api.js

Provides blockchain interaction endpoints for smart contract calls and transaction management.

### ipfs-api.js

Handles IPFS content pinning, retrieval, and gateway management.

## Development

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Netlify CLI (for local development)

### Installation

1. Install dependencies:

   ```bash
   cd netlify/functions
   npm install
   ```

2. Install Netlify CLI (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

### Local Development

To run the functions locally:

```bash
netlify dev
```

This will start the Netlify development server with your functions available at `http://localhost:8888/.netlify/functions/[function-name]`.

### Environment Variables

Create a `.env` file in the `netlify/functions` directory with the following variables:

```
# API Keys
API_KEY=your-api-key
IPFS_API_KEY=your-ipfs-api-key

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Deployment

The functions are automatically deployed to Netlify when changes are pushed to the main branch. Manual deployment can be performed using:

```bash
netlify deploy --prod
```

## Testing

### Unit Tests

Run the test suite with:

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

This will start the functions locally and run tests against them.

## Security

Our serverless functions implement several security measures:

1. **JWT Authentication**: Secure token-based authentication
2. **CORS Protection**: Configurable origin restrictions
3. **Rate Limiting**: Protection against DDoS and brute force attacks
4. **Input Validation**: Schema validation for all input data
5. **Environment Isolation**: Production secrets are isolated from development

## Performance Optimization

- Cold start optimization using keep-alive techniques
- Database connection pooling
- Response caching where appropriate
- Payload size minimization

## Function Structure

Each function follows a standard structure:

```javascript
// Required dependencies
const dependencies = require('./lib/dependencies');

// Handler function
exports.handler = async (event, context) => {
  try {
    // Parse input
    const { httpMethod, path, body } = event;

    // Process request
    const result = await processRequest(httpMethod, path, body);

    // Return response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    // Error handling
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};

// Helper functions
async function processRequest(method, path, body) {
  // Implementation
}
```

## Documentation

For detailed API documentation, see [API Reference](../../docs/api-reference.md).

## License

These functions are licensed under the [MIT License](/LICENSE).

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](/CONTRIBUTING.md) before submitting pull requests.
