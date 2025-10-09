# API Network Troubleshooting

If you see: `Failed to update remote data: Network request failed` in a production / preview build, check the following:

1. API_BASE_URL Not Set for Build
   - Ensure your `.env` contains: `API_BASE_URL=http://192.168.X.Y:8077` (LAN IP, not localhost) or a publicly reachable hostname.
   - Rebuild after changing environment variables. Metro dev server variables are not baked into a compiled build.

2. Using `localhost` in a Device Build
   - Physical devices cannot resolve your computer's `localhost`. Use your machine's LAN IP.
   - Android Emulator: `http://10.0.2.2:8077`  (AVD) or `http://10.0.3.2:8077` for Genymotion.
   - iOS Simulator: `http://localhost:8077` works, but not on a real device.

3. Cleartext (HTTP) vs HTTPS
   - For non-HTTPS endpoints on Android you need `android:usesCleartextTraffic="true"` (already added to `AndroidManifest.xml`).
   - If your backend supports HTTPS, prefer using `https://`.

4. Verify Server Reachability
   - From another machine or device browser: open `http://YOUR_IP:8077/v1/finance/summary?month=2025-10`.
   - If it fails, check firewall or backend binding (bind to 0.0.0.0 not 127.0.0.1).

5. CORS / Reverse Proxy (Web target)
   - For native mobile apps, CORS does not apply. For web builds, ensure proper CORS headers or use a proxy.

6. Timeout / Long Latency
   - Current timeout is 15s. Slow responses beyond that trigger an abort error. Optimize backend or increase time in `request()` if required.

7. Double Check the Base URL Construction
   - `BASE = (API_BASE_URL).replace(/\/$/, '') + '/v1'`
   - Make sure your `.env` does not already include `/v1` to avoid double path like `/v1/v1`.

8. Re-run a Local Preview Build After Changes
   - Clean build caches if issues persist.

## Quick Diagnostic Checklist
- [ ] Device on same Wi-Fi as backend machine
- [ ] Ping backend IP from device (use a network utility app if needed)
- [ ] Correct IP in `.env`
- [ ] Rebuilt app after editing `.env`
- [ ] Backend accessible via browser using same URL

## Example .env
```
API_BASE_URL=http://192.168.1.42:8077
```

Rebuild with `npm run build:apk:preview` after changes.
