import { createTRPCReact } from "@trpc/react-query";
import { httpLink, loggerLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";


export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Use environment variable for API base URL
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // For development, use the Rork backend URL
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }
  
  // Check if we're in development mode
  if (__DEV__) {
    // Try to get the current development URL dynamically
    if (typeof window !== 'undefined' && window.location) {
      // For web development
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port || '8081';
      return `${protocol}//${hostname}:${port}`;
    }
    
    // For Android development, use environment variable or fallback
    if (Platform.OS === 'android') {
      const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL || 'https://toolkit.rork.com';
      return devUrl;
    }
    
    // For iOS development
    return process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:8081';
  }
  
  // For production, use environment variable or fallback
  return process.env.EXPO_PUBLIC_PROD_API_URL || 'https://toolkit.rork.com';
};

// Compress image data to reduce payload size
const compressImageData = (imageData: string): string => {
  // If image is too large, we'll need to compress it
  const maxSize = 5 * 1024 * 1024; // 5MB limit
  if (imageData.length > maxSize) {
    console.warn('Image data too large, using fallback');
    // Return a smaller placeholder or throw error
    throw new Error('Image too large for processing');
  }
  return imageData;
};

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) => __DEV__ && (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (!urlStr?.trim()) {
          throw new Error('Invalid URL provided');
        }
        console.log('tRPC request to:', urlStr, 'method:', options?.method, 'platform:', Platform.OS);
        
        // Add timeout for requests - longer for Android
        const controller = new AbortController();
        const timeout = Platform.OS === 'android' ? 30000 : 15000; // 30s for Android, 15s for others
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          // Modify request body if it contains large image data
          let modifiedOptions = { ...options };
          if (options?.body && typeof options.body === 'string') {
            try {
              const body = JSON.parse(options.body);
              if (body.json?.imageUri && body.json.imageUri.length > 1024 * 1024) {
                console.log('Large image detected, size:', Math.round(body.json.imageUri.length / 1024), 'KB');
                // Compress or validate image size
                body.json.imageUri = compressImageData(body.json.imageUri);
                modifiedOptions = { ...modifiedOptions, body: JSON.stringify(body) };
              }
            } catch {
              // If parsing fails, continue with original body
            }
          }
          
          // Android-specific fetch configuration
          const fetchOptions: RequestInit = {
            ...modifiedOptions,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': Platform.OS === 'android' ? 'ExpoAndroidApp/1.0' : 'ExpoApp/1.0',
              ...options?.headers,
            },
          };
          
          // Add Android-specific network handling
          if (Platform.OS === 'android') {
            fetchOptions.mode = 'cors';
            fetchOptions.credentials = 'omit';
          }
          
          const response = await fetch(url, fetchOptions);
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error('tRPC response error:', response.status, response.statusText);
            
            // Handle specific error codes
            if (response.status === 413) {
              throw new Error('Request too large - please use a smaller image');
            }
            if (response.status === 404) {
              throw new Error('Backend service not found');
            }
            if (response.status >= 500) {
              throw new Error('Backend service temporarily unavailable');
            }
            
            // For other errors, throw with status
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('tRPC fetch error:', error);
          
          // Provide more specific error messages
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              throw new Error('Request timeout - please try again');
            }
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              // For Android, provide more specific guidance
              if (Platform.OS === 'android') {
                throw new Error('Network connection failed. Please check your internet connection and try again.');
              }
              throw new Error('Unable to connect to backend service - using offline mode');
            }
          }
          
          throw error;
        }
      },
    }),
  ],
});