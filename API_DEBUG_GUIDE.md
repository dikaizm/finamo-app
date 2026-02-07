# API Connection Debugging Guide

## Problem Summary

The app is not making API calls to the backend. No logs appear in the backend server.

## Root Cause Analysis

### Current Configuration
- **Backend running on**: `localhost:8077` ✅ (confirmed working via curl)
- **App configured to use**: `https://dev-finamo-api.stelarea.com` (from `.env`)
- **Issue**: The app may be running on an emulator/device that cannot reach the configured endpoint

## Solutions

### Option 1: Use Local Backend (Recommended for Development)

If you're testing on an **Android Emulator**, **iOS Simulator**, or **Physical Device**, you need to use your machine's local IP address instead of `localhost`.

#### Step 1: Find Your Local IP Address

Run this command:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for your local network IP (usually starts with `192.168.x.x` or `10.x.x.x`)

#### Step 2: Update `.env` File

Edit `/Users/dikaizm/Documents/PROGRAMMING/mobile-dev/finamo/finamo-app/.env`:

```bash
# For Android Emulator (special alias for host machine)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8077

# OR for iOS Simulator / Physical Device on same network
# Replace with YOUR actual local IP from Step 1
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8077
```

#### Step 3: Restart the App

After changing `.env`, you **must restart** the Metro bundler:
```bash
cd finamo-app
# Kill the current Metro process (Ctrl+C)
npm start
```

Then reload the app (press `r` in Metro or shake device and tap "Reload")

---

### Option 2: Use Remote Backend

If you want to use the remote server `https://dev-finamo-api.stelarea.com`:

#### Check if the remote server is accessible:
```bash
curl -X POST https://dev-finamo-api.stelarea.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'
```

If this fails, the remote server may be down or not configured correctly.

---

### Option 3: Test with Expo Go on Physical Device

If using Expo Go on a physical device:

1. **Ensure your phone and computer are on the same WiFi network**
2. **Use your computer's local IP** (not `localhost` or `10.0.2.2`)
3. **Update `.env`** with your local IP:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8077
   ```

---

## Quick Reference: Network Addresses

| Platform | Address to Use |
|----------|---------------|
| **Android Emulator** | `http://10.0.2.2:8077` |
| **iOS Simulator** | `http://localhost:8077` or `http://127.0.0.1:8077` |
| **Physical Device (same WiFi)** | `http://YOUR_LOCAL_IP:8077` |
| **Web Browser** | `http://localhost:8077` |

---

## Debugging Steps

### 1. Check Console Logs

With the debug logging added, you should see:
```
[API Config] Resolved URLs: { API_BASE_URL: '...', API_URL_V1: '...' }
[AuthContext] API Configuration: { ... }
[AuthContext] Attempting login to: ...
```

### 2. Check Network Errors

If you see errors like:
- `Network Error` or `Network request failed` → Cannot reach the server
- `ECONNREFUSED` → Server is not running or wrong address
- `timeout` → Server is too slow or unreachable
- `404` → Wrong endpoint path
- `CORS error` → CORS not configured (only affects web)

### 3. Verify Backend is Running

```bash
cd finamo-be
docker-compose ps
```

Should show `finamo-api` with status `Up` and port `0.0.0.0:8077->8077/tcp`

### 4. Test Backend Directly

```bash
curl -X POST http://localhost:8077/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'
```

Should return a 200 response with user data.

---

## Common Issues

### Issue: "Network request failed" on Android Emulator

**Solution**: Use `http://10.0.2.2:8077` instead of `localhost`

### Issue: "Network request failed" on Physical Device

**Solution**: 
1. Ensure device and computer are on same WiFi
2. Use computer's local IP address
3. Check firewall isn't blocking port 8077

### Issue: Changes to `.env` not taking effect

**Solution**: 
1. Stop Metro bundler (Ctrl+C)
2. Clear cache: `npm start -- --reset-cache`
3. Reload app

### Issue: Backend logs show no requests

**Solution**: The app is likely not reaching the backend at all. Check:
1. Console logs show the correct URL
2. Network address is correct for your platform
3. Backend is actually running on the expected port

---

## Next Steps

1. **Check the console logs** when you try to login/register - you should see the debug output
2. **Update `.env`** with the correct address for your testing environment
3. **Restart Metro** and reload the app
4. **Try to login/register** and check both app console and backend logs
