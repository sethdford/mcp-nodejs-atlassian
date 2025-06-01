import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server as HttpServer } from 'http';
import { Logger } from '../utils/logger.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export interface HttpTransportOptions {
  host: string;
  port: number;
  path?: string;
}

export class SSETransport {
  private server: HttpServer;
  private logger: Logger;

  constructor(private options: HttpTransportOptions) {
    this.logger = new Logger('sse-transport');
    this.server = createServer();
  }

  async start(mcpServer: Server): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('request', (req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res, mcpServer);
      });

      this.server.on('error', reject);

      this.server.listen(this.options.port, this.options.host, () => {
        this.logger.info(`SSE server listening on ${this.options.host}:${this.options.port}`);
        resolve();
      });
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse, mcpServer: Server): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = this.options.path || '/sse';

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (url.pathname === path && req.method === 'GET') {
      // SSE endpoint
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      res.write('data: {"jsonrpc": "2.0", "method": "initialized", "params": {}}\n\n');

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
        this.logger.debug('SSE connection closed');
      });

    } else if (url.pathname === path && req.method === 'POST') {
      // Handle incoming messages
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const message = JSON.parse(body);
          this.logger.debug('Received message:', message);
          
          // Process with MCP server (simplified)
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} }));
        } catch (error) {
          this.logger.error('Error processing message:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.logger.info('SSE server closed');
        resolve();
      });
    });
  }
}

export class StreamableHttpTransport {
  private server: HttpServer;
  private logger: Logger;

  constructor(private options: HttpTransportOptions) {
    this.logger = new Logger('streamable-http-transport');
    this.server = createServer();
  }

  async start(mcpServer: Server): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('request', (req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res, mcpServer);
      });

      this.server.on('error', reject);

      this.server.listen(this.options.port, this.options.host, () => {
        this.logger.info(`Streamable HTTP server listening on ${this.options.host}:${this.options.port}`);
        resolve();
      });
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse, mcpServer: Server): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = this.options.path || '/mcp';

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (url.pathname === path && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const message = JSON.parse(body);
          this.logger.debug('Received message:', message);
          
          // Process with MCP server (simplified)
          // In a real implementation, we'd need to integrate with the MCP protocol properly
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            jsonrpc: '2.0', 
            id: message.id, 
            result: { message: 'Streamable HTTP transport not fully implemented yet' }
          }));
        } catch (error) {
          this.logger.error('Error processing message:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

    } else if (url.pathname === '/' && req.method === 'GET') {
      // Health check endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', transport: 'streamable-http' }));

    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.logger.info('Streamable HTTP server closed');
        resolve();
      });
    });
  }
} 