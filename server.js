const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');

// HTTPS server configuration
const HOST = '209.38.199.154';
const PORT = 443;

// SSL certificates paths
const SSL_KEY = '/etc/letsencrypt/live/appstoreredteam.uz/privkey.pem';
const SSL_CERT = '/etc/letsencrypt/live/appstoreredteam.uz/fullchain.pem';

// Create a simple request logger
function logRequest(req) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const requestUrl = req.url;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIP = req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';
    const headers = JSON.stringify(req.headers, null, 2);
    
    console.log('='.repeat(80));
    console.log(`[${timestamp}] NEW REQUEST`);
    console.log(`Method: ${method}`);
    console.log(`URL: ${requestUrl}`);
    console.log(`Client IP: ${clientIP}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Headers:`);
    console.log(headers);
    console.log('='.repeat(80));
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

        // Load SSL certificates
        const options = {
            key: fs.readFileSync(SSL_KEY),
            cert: fs.readFileSync(SSL_CERT)
        };

        // Create the HTTPS server
        const server = https.createServer(options, (req, res) => {
            // Log the request
            logRequest(req);

            // Handle POST data if present
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                if (body) {
                    console.log(`Request Body: ${body}`);
                    console.log('='.repeat(80));
                }

                // Send a simple response
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                });

                const response = {
                    message: 'Request logged successfully',
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    url: req.url,
                    received: true
                };

                res.end(JSON.stringify(response, null, 2));
            });
        });

        // Start the server
        server.listen(PORT, HOST, () => {
            console.log(`🚀 HTTPS Logger Server started!`);
            console.log(`📍 Listening on: https://${HOST}:${PORT}`);
            console.log(`📝 Logging all incoming requests...`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
            console.log('='.repeat(80));
        });

        // Handle server errors
        server.on('error', (err) => {
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
            console.log('\n🛑 Shutting down server...');
            server.close(() => {
                console.log('✅ Server closed successfully');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
createServer();
