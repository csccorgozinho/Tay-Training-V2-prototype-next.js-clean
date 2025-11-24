/**
 * Unified API Client Utility
 * Provides consistent data fetching patterns across the entire application
 * Type-safe wrapper around fetch() with automatic response unwrapping
 */

import { ApiResponse } from '@/types';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Extract data from API response wrapper or return raw data
 */
function extractResponseData<T>(response: unknown): T {
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    
    if ('data' in obj && 'success' in obj) {
      return obj.data as T;
    }
    
    if (Array.isArray(response) || !('success' in obj)) {
      return response as T;
    }
  }
  
  return response as T;
}

/**
 * Main API client with consistent error handling and response extraction
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
  } = config;

  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (endpoint.startsWith('/api/')) {
    url = endpoint;
  } else if (endpoint.startsWith('/')) {
    url = `/api${endpoint}`;
  } else {
    url = `/api/${endpoint}`;
  }
  
  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestConfig.body = JSON.stringify(body);
  }

  if (signal) {
    requestConfig.signal = signal;
  }

  try {
    const response = await fetch(url, requestConfig);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return extractResponseData<T>(data);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error(`Failed to fetch ${url}:`, err);
    throw err;
  }
}

/**
 * GET request - fetches data
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET', signal });
}

/**
 * POST request - creates data
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: 'POST', body, signal });
}

/**
 * PUT request - updates data
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: 'PUT', body, signal });
}

/**
 * DELETE request - deletes data
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE', signal });
}

/**
 * PATCH request - partial updates
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: 'PATCH', body, signal });
}

/**
 * Parallel fetching utility for multiple endpoints
 */
export async function apiGetMultiple<T = unknown>(
  endpoints: string[]
): Promise<T[]> {
  return Promise.all(endpoints.map(endpoint => apiGet<T>(endpoint)));
}

