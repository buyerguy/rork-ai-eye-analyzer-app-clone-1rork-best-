import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Configure body size limits for image uploads
app.use('*', async (c, next) => {
  // Add headers for larger request bodies and CORS
  c.header('Access-Control-Max-Age', '86400');
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  
  // Check request body size to prevent 413 errors
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength) > 4 * 1024 * 1024) { // 4MB limit
    console.warn('Request body too large:', contentLength);
    return c.json({ error: 'Request body too large. Please use a smaller image.' }, 413);
  }
  
  await next();
});

// Enable CORS for all routes with proper configuration
const allowedOrigins = [
  'http://localhost:8081',
  'https://rork.com',
  process.env.EXPO_PUBLIC_WEB_URL,
  process.env.EXPO_PUBLIC_PROD_URL
].filter((origin): origin is string => Boolean(origin));

app.use("*", cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));

// Add error handling middleware
app.onError((err, c) => {
  console.error('Backend error:', err);
  return c.json({ 
    error: 'Internal server error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500);
});

// Mount tRPC router at /trpc with body size limit
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    // Configure request handling
    onError: ({ error, path }) => {
      console.error('tRPC error on path:', path, 'error:', error.message);
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "AI Eye Analyzer API is running",
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to test connectivity
app.get("/debug", (c) => {
  const headers = c.req.header();
  return c.json({ 
    message: "Debug endpoint working",
    headers: headers,
    url: c.req.url,
    method: c.req.method
  });
});

// Test endpoint for tRPC connectivity
app.post("/test-trpc", async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      message: "tRPC test endpoint working",
      receivedData: {
        bodySize: JSON.stringify(body).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

export default app;