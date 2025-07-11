const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

// HTTPS server configuration
const HOST = '209.38.199.154';
const PORT = 443;

// SSL certificates paths
const SSL_KEY = '/etc/letsencrypt/live/appstoreredteam.uz/privkey.pem';
const SSL_CERT = '/etc/letsencrypt/live/appstoreredteam.uz/fullchain.pem';

// Log file path
const LOG_FILE = 'log.txt';

// Create a comprehensive logger
function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // Write to console
    console.log(message);
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logEntry);
}

function logRequest(req, requestId) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const requestUrl = req.url;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIP = req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';
    const targetHost = req.headers.host || 'Unknown';
    
    const separator = '='.repeat(80);
    const logMessage = `${separator}
[${timestamp}] NEW REQUEST [ID: ${requestId}]
Method: ${method}
URL: ${requestUrl}
Target Host: ${targetHost}
Client IP: ${clientIP}
User-Agent: ${userAgent}
Headers:
${JSON.stringify(req.headers, null, 2)}
${separator}`;
    
    writeLog(logMessage);
}

function logRequestBody(body, requestId) {
    if (body) {
        writeLog(`[ID: ${requestId}] Request Body: ${body}`);
        writeLog('='.repeat(80));
    }
}

function logResponse(response, body, requestId, targetHost) {
    const timestamp = new Date().toISOString();
    const statusCode = response.statusCode;
    const statusMessage = response.statusMessage;
    
    const separator = '='.repeat(80);
    const logMessage = `${separator}
[${timestamp}] RESPONSE [ID: ${requestId}]
Target Host: ${targetHost}
Status: ${statusCode} ${statusMessage}
Response Headers:
${JSON.stringify(response.headers, null, 2)}
Response Body:
${body}
${separator}`;
    
    writeLog(logMessage);
}

function logError(error, requestId, targetHost) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR [ID: ${requestId}] Target: ${targetHost} - ${error.message}`;
    writeLog(logMessage);
}

// Forward request to target server
function forwardRequest(req, res, requestBody, requestId) {
    const targetHost = req.headers.host;
    
    if (!targetHost) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No host header provided' }));
        return;
    }

    // Parse the target URL
    const targetUrl = url.parse(req.url);
    
    // Prepare request options
    const options = {
        hostname: targetHost,
        port: 443, // Assuming HTTPS for the target
        path: req.url,
        method: req.method,
        headers: { ...req.headers },
        rejectUnauthorized: false // Ignore SSL certificate errors
    };

    // Remove host-specific headers that might cause issues
    delete options.headers['host'];
    options.headers['host'] = targetHost;

    writeLog(`[ID: ${requestId}] Forwarding ${req.method} request to https://${targetHost}${req.url}`);

    // Create the request to target server
    const proxyReq = https.request(options, (proxyRes) => {
        let responseBody = '';

        // Collect response data
        proxyRes.on('data', (chunk) => {
            responseBody += chunk;
        });

        proxyRes.on('end', () => {
            // Log the response
            logResponse(proxyRes, responseBody, requestId, targetHost);

            // Forward response headers to client
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            
            // Send response body to client
            res.end(responseBody);
        });
    });

    // Handle proxy request errors
    proxyReq.on('error', (error) => {
        logError(error, requestId, targetHost);
        
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Bad Gateway', 
            message: `Failed to connect to ${targetHost}`,
            details: error.message 
        }));
    });

    // Send request body if present
    if (requestBody) {
        proxyReq.write(requestBody);
    }
    
    proxyReq.end();
}

// Create HTTPS server
function createServer() {
    try {
        // Check if SSL certificates exist
        if (!fs.existsSync(SSL_KEY) || !fs.existsSync(SSL_CERT)) {
            console.error('SSL certificates not found!');
            console.log('Please run generate-certs.bat to create SSL certificates first.');
            process.exit(1);
        }

        // Initialize log file
        const startupMessage = `
${'='.repeat(80)}
HTTPS PROXY SERVER STARTED
Timestamp: ${new Date().toISOString()}
Listening on: https://${HOST}:${PORT}
${'='.repeat(80)}
`;
        writeLog(startupMessage);

        // Load SSL certificates
        const options = {
            key: fs.readFileSync(SSL_KEY),
            cert: fs.readFileSync(SSL_CERT)
        };

        // Create the HTTPS server
        const server = https.createServer(options, (req, res) => {
            // Generate unique request ID
            const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            // Log the request
            logRequest(req, requestId);

            // Handle request body
            let requestBody = '';
            req.on('data', chunk => {
                requestBody += chunk.toString();
            });

            req.on('end', () => {
                // Log request body if present
                logRequestBody(requestBody, requestId);

                // Forward the request
                forwardRequest(req, res, requestBody, requestId);
            });
        });

        // Start the server
        server.listen(PORT, HOST, () => {
            const startMessage = `🚀 HTTPS Proxy Server started!
📍 Listening on: https://${HOST}:${PORT}
📝 Logging all requests and responses to: ${LOG_FILE}
🔄 Forwarding requests to hosts specified in headers
⏰ Started at: ${new Date().toISOString()}`;
            
            console.log(startMessage);
            console.log('='.repeat(80));
        });

        // Handle server errors
        server.on('error', (err) => {
            const errorMessage = `Server Error: ${err.message}`;
            writeLog(errorMessage);
            
            if (err.code === 'EACCES') {
                console.error(`Permission denied! Port ${PORT} requires administrator privileges.`);
                console.log('Try running as administrator or use a different port (like 8443).');
            } else if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use!`);
            } else {
                console.error('Server error:', err.message);
            }
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            const shutdownMessage = `
${'='.repeat(80)}
HTTPS PROXY SERVER SHUTDOWN
Timestamp: ${new Date().toISOString()}
${'='.repeat(80)}
`;
            writeLog(shutdownMessage);
            
            console.log('\n🛑 Shutting down server...');
            server.close(() => {
                console.log('✅ Server closed successfully');
                process.exit(0);
            });
        });

    } catch (error) {
        writeLog(`Failed to start server: ${error.message}`);
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
createServer();