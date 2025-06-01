#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { createAtlassianMCPServer } from './server/main.js';
import { Logger } from './utils/logger.js';
import { runOAuthSetup } from './utils/oauth-setup.js';

const program = new Command();
const logger = new Logger('main');

program
  .name('mcp-atlassian')
  .description('MCP Atlassian Server - Jira and Confluence functionality for MCP')
  .version('1.0.0');

program
  .option('-v, --verbose', 'Increase verbosity', false)
  .option('--env-file <path>', 'Path to .env file')
  .option('--oauth-setup', 'Run OAuth 2.0 setup wizard for Atlassian Cloud')
  .option('--transport <type>', 'Transport type (stdio, sse, or streamable-http)', 'stdio')
  .option('--port <number>', 'Port to listen on for SSE or Streamable HTTP transport', '8000')
  .option('--host <host>', 'Host to bind to for SSE or Streamable HTTP transport', '0.0.0.0')
  .option('--path <path>', 'Path for Streamable HTTP transport', '/mcp')
  .option('--confluence-url <url>', 'Confluence URL')
  .option('--confluence-username <username>', 'Confluence username/email')
  .option('--confluence-token <token>', 'Confluence API token')
  .option('--confluence-personal-token <token>', 'Confluence Personal Access Token')
  .option('--confluence-ssl-verify', 'Verify SSL certificates for Confluence', true)
  .option('--confluence-spaces-filter <spaces>', 'Comma-separated list of Confluence space keys')
  .option('--jira-url <url>', 'Jira URL')
  .option('--jira-username <username>', 'Jira username/email')
  .option('--jira-token <token>', 'Jira API token')
  .option('--jira-personal-token <token>', 'Jira Personal Access Token')
  .option('--jira-ssl-verify', 'Verify SSL certificates for Jira', true)
  .option('--jira-projects-filter <projects>', 'Comma-separated list of Jira project keys')
  .option('--read-only', 'Run in read-only mode (disables all write operations)')
  .option('--enabled-tools <tools>', 'Comma-separated list of tools to enable')
  .option('--oauth-client-id <id>', 'OAuth 2.0 client ID for Atlassian Cloud')
  .option('--oauth-client-secret <secret>', 'OAuth 2.0 client secret for Atlassian Cloud')
  .option('--oauth-redirect-uri <uri>', 'OAuth 2.0 redirect URI for Atlassian Cloud')
  .option('--oauth-scope <scope>', 'OAuth 2.0 scopes (space-separated) for Atlassian Cloud')
  .option('--oauth-cloud-id <id>', 'Atlassian Cloud ID for OAuth 2.0 authentication')
  .action(async (options) => {
    try {
      // Load environment variables
      if (options.envFile) {
        logger.debug(`Loading environment from file: ${options.envFile}`);
        dotenv.config({ path: options.envFile, override: true });
      } else {
        logger.debug('Attempting to load environment from default .env file if it exists');
        dotenv.config({ override: true });
      }

      // Set up logging level
      if (options.verbose) {
        Logger.setLevel('debug');
      } else if (process.env.MCP_VERBOSE === 'true') {
        Logger.setLevel('info');
      }

      // Handle OAuth setup
      if (options.oauthSetup) {
        logger.info('Starting OAuth 2.0 setup wizard');
        await runOAuthSetup();
        return;
      }

      // Set environment variables from CLI options
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && key !== 'envFile' && key !== 'oauthSetup' && typeof value !== 'function') {
          // Skip boolean flags that are false or complex objects
          if (typeof value === 'boolean' && !value) return;
          
          const envKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
          const stringValue = typeof value === 'string' ? value : 
                             typeof value === 'number' ? String(value) :
                             typeof value === 'boolean' ? 'true' : '';
          
          if (key.startsWith('confluence')) {
            process.env[envKey.replace('CONFLUENCE_', 'CONFLUENCE_')] = stringValue;
          } else if (key.startsWith('jira')) {
            process.env[envKey.replace('JIRA_', 'JIRA_')] = stringValue;
          } else if (key.startsWith('oauth')) {
            process.env[`ATLASSIAN_${envKey.replace('OAUTH_', 'OAUTH_')}`] = stringValue;
          } else {
            process.env[envKey] = stringValue;
          }
        }
      });

      // Start the MCP server
      const server = createAtlassianMCPServer();
      
      const transport = options.transport || process.env.TRANSPORT || 'stdio';
      
      if (transport === 'stdio') {
        logger.info('Starting server with STDIO transport');
        await server.connect({
          type: 'stdio'
        });
      } else {
        const port = parseInt(options.port || process.env.PORT || '8000');
        const host = options.host || process.env.HOST || '0.0.0.0';
        const path = options.path || process.env.STREAMABLE_HTTP_PATH || '/mcp';
        
        logger.info(`Starting server with ${transport.toUpperCase()} transport on http://${host}:${port}${path}`);
        
        await server.connect({
          type: transport as 'sse' | 'streamable-http',
          host,
          port,
          path
        });
      }
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program.parse(); 