import { createServer } from 'http';
import { parse } from 'url';
import { createInterface } from 'readline';
import { Logger } from './logger.js';
import axios from 'axios';

const logger = new Logger('oauth-setup');

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  cloudId?: string;
}

export async function runOAuthSetup(): Promise<void> {
  logger.info('OAuth 2.0 setup wizard for Atlassian Cloud');
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Collect OAuth configuration
    const config = await collectOAuthConfig(rl);
    
    // Start local callback server
    const { server, port } = await startCallbackServer();
    
    // Update redirect URI if using localhost
    if (config.redirectUri.includes('localhost')) {
      config.redirectUri = `http://localhost:${port}/callback`;
    }
    
    // Generate authorization URL
    const authUrl = generateAuthUrl(config);
    
    logger.info('\n🔗 Please open this URL in your browser to authorize the application:');
    logger.info(`\n${authUrl}\n`);
    
    // Wait for callback
    const authCode = await waitForCallback(server);
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(config, authCode);
    
    // Get cloud ID if not provided
    if (!config.cloudId) {
      config.cloudId = await getCloudId(tokens.access_token);
    }
    
    // Display results
    displayResults(config, tokens);
    
  } catch (error) {
    logger.error('OAuth setup failed:', error);
  } finally {
    rl.close();
  }
}

async function collectOAuthConfig(rl: any): Promise<OAuthConfig> {
  const config: Partial<OAuthConfig> = {};
  
  config.clientId = await question(rl, 'Enter your OAuth Client ID: ');
  config.clientSecret = await question(rl, 'Enter your OAuth Client Secret: ');
  config.redirectUri = await question(rl, 'Enter your Redirect URI (default: http://localhost:8080/callback): ') 
    || 'http://localhost:8080/callback';
  config.scope = await question(rl, 'Enter OAuth scopes (default: read:jira-work write:jira-work read:confluence-content.all write:confluence-content offline_access): ') 
    || 'read:jira-work write:jira-work read:confluence-content.all write:confluence-content offline_access';
  
  const cloudIdInput = await question(rl, 'Enter your Cloud ID (optional, will auto-detect): ');
  if (cloudIdInput) {
    config.cloudId = cloudIdInput;
  }
  
  return config as OAuthConfig;
}

function question(rl: any, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

async function startCallbackServer(): Promise<{ server: any, port: number }> {
  const server = createServer();
  const port = 8080;
  
  return new Promise((resolve, reject) => {
    server.listen(port, 'localhost', () => {
      logger.info(`Callback server started on http://localhost:${port}`);
      resolve({ server, port });
    });
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Please close other applications using this port.`));
      } else {
        reject(error);
      }
    });
  });
}

function generateAuthUrl(config: OAuthConfig): string {
  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: config.clientId,
    scope: config.scope,
    redirect_uri: config.redirectUri,
    state: Math.random().toString(36).substring(7),
    response_type: 'code',
    prompt: 'consent'
  });
  
  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}

async function waitForCallback(server: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Timeout waiting for OAuth callback (5 minutes)'));
    }, 5 * 60 * 1000); // 5 minutes
    
    server.on('request', (req: any, res: any) => {
      const url = parse(req.url, true);
      
      if (url.pathname === '/callback') {
        const code = url.query.code as string;
        const error = url.query.error as string;
        
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>❌ Authorization Failed</h1>
                <p>Error: ${error}</p>
                <p>Description: ${url.query.error_description || 'Unknown error'}</p>
              </body>
            </html>
          `);
          clearTimeout(timeout);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>✅ Authorization Successful</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);
          clearTimeout(timeout);
          server.close();
          resolve(code);
          return;
        }
      }
      
      res.writeHead(404);
      res.end('Not Found');
    });
  });
}

async function exchangeCodeForTokens(config: OAuthConfig, code: string) {
  try {
    const response = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`);
  }
}

async function getCloudId(accessToken: string): Promise<string> {
  try {
    const response = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const resources = response.data;
    if (resources.length === 0) {
      throw new Error('No accessible Atlassian resources found');
    }
    
    if (resources.length === 1) {
      logger.info(`Auto-detected Cloud ID: ${resources[0].id} (${resources[0].name})`);
      return resources[0].id;
    }
    
    // Multiple resources - let user choose
    logger.info('\nMultiple Atlassian resources found:');
    resources.forEach((resource: any, index: number) => {
      logger.info(`${index + 1}. ${resource.name} (${resource.id})`);
    });
    
    // For now, just use the first one
    logger.info(`Using first resource: ${resources[0].name} (${resources[0].id})`);
    return resources[0].id;
    
  } catch (error: any) {
    throw new Error(`Failed to get Cloud ID: ${error.response?.data?.message || error.message}`);
  }
}

function displayResults(config: OAuthConfig, tokens: any): void {
  logger.info('\n🎉 OAuth setup completed successfully!');
  logger.info('\nAdd these environment variables to your .env file:');
  logger.info('\n# OAuth 2.0 Configuration');
  logger.info(`ATLASSIAN_OAUTH_CLIENT_ID=${config.clientId}`);
  logger.info(`ATLASSIAN_OAUTH_CLIENT_SECRET=${config.clientSecret}`);
  logger.info(`ATLASSIAN_OAUTH_REDIRECT_URI=${config.redirectUri}`);
  logger.info(`ATLASSIAN_OAUTH_SCOPE=${config.scope}`);
  if (config.cloudId) {
    logger.info(`ATLASSIAN_OAUTH_CLOUD_ID=${config.cloudId}`);
  }
  logger.info(`ATLASSIAN_OAUTH_ACCESS_TOKEN=${tokens.access_token}`);
  if (tokens.refresh_token) {
    logger.info(`ATLASSIAN_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
  }
  logger.info('\n⚠️  Keep these credentials secure and do not commit them to version control!');
  
  // Also show URLs
  const baseUrl = `https://api.atlassian.com/ex/jira/${config.cloudId}`;
  const confluenceUrl = `https://api.atlassian.com/ex/confluence/${config.cloudId}`;
  
  logger.info('\nYour Atlassian URLs for configuration:');
  logger.info(`JIRA_URL=${baseUrl}`);
  logger.info(`CONFLUENCE_URL=${confluenceUrl}/wiki`);
} 