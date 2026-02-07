import axios, { AxiosInstance } from 'axios';

// Base configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev-finamo-api.stelarea.com';

// API version URLs
export const API_URL_V1 = `${API_BASE_URL}/v1`;
// Future versions can be added here:
// export const API_URL_V2 = `${API_BASE_URL}/v2`;

// Debug: Log the resolved API URLs
console.log('[API Config] Resolved URLs:', { API_BASE_URL, API_URL_V1 });

/**
 * Create a configured axios instance for a specific API version
 */
function createApiClient(baseURL: string, version: string): AxiosInstance {
    const client = axios.create({
        baseURL,
        timeout: 30000, // 30 second timeout
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    // Add request interceptor for debugging
    client.interceptors.request.use(
        (config) => {
            console.log(`[API ${version} Request]`, {
                method: config.method?.toUpperCase(),
                url: config.url,
                baseURL: config.baseURL,
                fullURL: `${config.baseURL}${config.url}`,
            });
            return config;
        },
        (error) => {
            console.error(`[API ${version} Request Error]`, error);
            return Promise.reject(error);
        }
    );

    // Add response interceptor for debugging
    client.interceptors.response.use(
        (response) => {
            console.log(`[API ${version} Response]`, {
                status: response.status,
                url: response.config.url,
            });
            return response;
        },
        (error) => {
            console.error(`[API ${version} Response Error]`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
            });
            return Promise.reject(error);
        }
    );

    return client;
}

// API clients for each version
export const apiClientV1 = createApiClient(API_URL_V1, 'v1');

// Future versions can be added here:
// export const apiClientV2 = createApiClient(API_URL_V2, 'v2');

// Default export for backward compatibility (points to v1)
export const apiClient = apiClientV1;
