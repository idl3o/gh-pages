import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * Cloudflare Worker Script for Project RED X Edge Deployment
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);
  
  try {
    // Static asset handling with improved caching
    let options = {
      cacheControl: {
        bypassCache: false,
        edgeTTL: 86400,  // 24 hours
        browserTTL: 86400,  // 24 hours
      }
    };
    
    // Special handling for WebAssembly files
    if (url.pathname.endsWith('.wasm')) {
      options.contentType = 'application/wasm';
    }
    
    // Special handling for API requests in static deployment
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(url, event.request);
    }
    
    // Handle assets from KV storage
    return await getAssetFromKV(event, options);
    
  } catch (e) {
    // Fall back to 404.html
    return new Response(await getAssetFromKV(event, {
      mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req)
    }), { status: 404 });
  }
}

/**
 * Handle API requests with edge computing
 * Provides static fallbacks for APIs that require backend services
 */
async function handleApiRequest(url, request) {
  // API version endpoint
  if (url.pathname === '/api/version') {
    return new Response(JSON.stringify({
      version: 'Edge Deployment',
      runtime: 'Cloudflare Workers',
      platform: 'Edge'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Minimal Claude AI endpoint simulation for edge
  if (url.pathname === '/api/claude' && request.method === 'POST') {
    const data = await request.json();
    
    return new Response(JSON.stringify({
      response: `This is a static edge-deployed version. The message "${data.prompt}" would normally be processed by Claude 4 AI, but real AI functionality requires the full server deployment.`,
      model: "Claude Edge Simulation"
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Generic 404 for other API endpoints
  return new Response(JSON.stringify({
    error: 'API not available in edge deployment',
    endpoint: url.pathname
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
