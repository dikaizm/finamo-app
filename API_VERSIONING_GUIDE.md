# API Versioning Guide

## Overview

The API client configuration now supports multiple API versions, making it easy to migrate to new API versions without breaking existing code.

## Current Setup

### Available Clients

- **`apiClientV1`** - API v1 client (current version)
- **`apiClient`** - Default client (points to v1 for backward compatibility)

### Configuration

All version URLs are defined in `src/config/api.ts`:

```typescript
export const API_URL_V1 = `${API_BASE_URL}/v1`;
// Future: export const API_URL_V2 = `${API_BASE_URL}/v2`;
```

## Usage

### Using the Default Client (v1)

```typescript
import { apiClient } from '../config/api';

// Makes request to /v1/auth/login
const response = await apiClient.post('/auth/login', { email, password });
```

### Using Specific Version

```typescript
import { apiClientV1 } from '../config/api';

// Explicitly use v1
const response = await apiClientV1.post('/auth/login', { email, password });
```

## Adding a New API Version

When you need to add v2 of the API:

### Step 1: Update `src/config/api.ts`

```typescript
// Add the new version URL
export const API_URL_V2 = `${API_BASE_URL}/v2`;

// Create the new client
export const apiClientV2 = createApiClient(API_URL_V2, 'v2');
```

### Step 2: Migrate Services Gradually

You can migrate services one at a time:

```typescript
// Old service using v1
import { apiClientV1 } from '../config/api';

export const oldService = {
  getData: async () => {
    return await apiClientV1.get('/data');
  }
};

// New service using v2
import { apiClientV2 } from '../config/api';

export const newService = {
  getData: async () => {
    return await apiClientV2.get('/data');
  }
};
```

### Step 3: Update Default Client (Optional)

When ready to make v2 the default:

```typescript
// Change this line in api.ts
export const apiClient = apiClientV2; // Changed from apiClientV1
```

## Features

### Automatic Logging

Each API client logs requests and responses with the version number:

```
[API v1 Request] { method: 'POST', url: '/auth/login', ... }
[API v1 Response] { status: 200, url: '/auth/login' }
```

When you add v2:

```
[API v2 Request] { method: 'GET', url: '/users', ... }
[API v2 Response] { status: 200, url: '/users' }
```

### Shared Configuration

All clients share the same configuration:
- 30-second timeout
- JSON headers
- Request/response interceptors
- Error handling

### Independent Headers

Each client maintains its own headers (e.g., auth tokens):

```typescript
// Set auth token for v1
apiClientV1.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// v2 can have different auth
apiClientV2.defaults.headers.common['Authorization'] = `Bearer ${v2Token}`;
```

## Migration Strategy

### Gradual Migration (Recommended)

1. Add v2 client alongside v1
2. Migrate one service at a time
3. Test thoroughly
4. Keep v1 running until all services migrated
5. Eventually deprecate v1

### Big Bang Migration

1. Add v2 client
2. Update all services at once
3. Change default client to v2
4. Remove v1 references

## Example: Migrating Auth Service

```typescript
// Before (using v1)
import { apiClient } from '../config/api';

const login = async (email: string, password: string) => {
  return await apiClient.post('/auth/login', { email, password });
};

// After (using v2)
import { apiClientV2 } from '../config/api';

const login = async (email: string, password: string) => {
  return await apiClientV2.post('/auth/login', { email, password });
};
```

## Benefits

✅ **No Breaking Changes** - Existing code continues to work
✅ **Gradual Migration** - Migrate services one at a time
✅ **Clear Versioning** - Easy to see which version each service uses
✅ **Independent Configuration** - Each version can have different settings
✅ **Better Debugging** - Logs show which API version is being called
