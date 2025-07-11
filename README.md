# Node.js HTTPS Logger Server

A simple HTTPS server that logs every incoming request with detailed information.

## Features
- HTTPS server with multiple configuration options:
  - `server.js` - Original version for 192.168.137.1:443 (requires admin privileges)
  - `server-8443.js` - Version for 192.168.137.1:8443
  - `server-localhost.js` - Localhost version for testing (127.0.0.1:8443)
- Logs all incoming requests with:
  - Timestamp
  - HTTP method
  - URL
  - Client IP
  - User-Agent
  - Headers
  - Request body (for POST/PUT requests)
- CORS enabled for cross-origin requests
- JSON responses
- Graceful shutdown handling

## Setup Instructions

✅ **SSL certificates are already generated!**
✅ **No external dependencies needed!**

### Quick Start - Choose your version:

#### Option 1: Test with Localhost (Recommended for testing)
```bash
node server-localhost.js
```
Access at: `https://127.0.0.1:8443`

#### Option 2: Use specific IP on port 8443
```bash
node server-8443.js
```
Access at: `https://192.168.137.1:8443`

#### Option 3: Original version (requires admin privileges)
```bash
node server.js
```
Access at: `https://192.168.137.1:443`

**Note:** Port 443 requires administrator privileges.

## Alternative Setup (Different Port)

If you can't run on port 443, you can modify the server to use a different port like 8443:

1. Edit `server.js`
2. Change `const PORT = 443;` to `const PORT = 8443;`
3. Run without administrator privileges

## Testing the Server

### Quick Test Script
Run the provided test script:
```bash
test-server.bat
```

### Manual Testing

#### For localhost version (server-localhost.js):
```bash
# Using curl
curl -k https://127.0.0.1:8443

# Using PowerShell
Invoke-RestMethod -Uri "https://127.0.0.1:8443" -SkipCertificateCheck

# Using browser
# Navigate to https://127.0.0.1:8443
```

#### For IP-specific versions:
```bash
# Using curl
curl -k https://192.168.137.1:8443

# Using PowerShell
Invoke-RestMethod -Uri "https://192.168.137.1:8443" -SkipCertificateCheck
```

**Note:** You'll need to accept the self-signed certificate warning in browsers.

## Sample Log Output

```
================================================================================
[2024-12-19T10:30:45.123Z] NEW REQUEST
Method: GET
URL: /api/test
Client IP: ::ffff:192.168.137.100
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Headers:
{
  "host": "192.168.137.1:443",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.5",
  "accept-encoding": "gzip, deflate",
  "connection": "keep-alive"
}
================================================================================
```

## Stopping the Server

Press `Ctrl+C` to gracefully stop the server.
