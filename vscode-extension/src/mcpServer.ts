import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export class McpServerManager {
    private serverProcess: ChildProcess | null = null;
    private outputChannel: vscode.OutputChannel;
    private statusBarItem: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Atlassian MCP Server');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = '$(server) MCP: Stopped';
        this.statusBarItem.command = 'atlassianMcp.configure';
        this.statusBarItem.tooltip = 'Atlassian MCP Server Status';
        this.statusBarItem.show();
        
        context.subscriptions.push(this.outputChannel, this.statusBarItem);
    }

    async startServer(): Promise<void> {
        if (this.serverProcess) {
            this.outputChannel.appendLine('Server is already running');
            vscode.window.showWarningMessage('MCP Server is already running');
            return;
        }

        try {
            const config = vscode.workspace.getConfiguration('atlassianMcp');
            const serverPath = this.getServerPath();
            
            if (!serverPath) {
                throw new Error('MCP server not found. Please ensure the server is bundled with the extension.');
            }

            const args = [
                '--transport', 'sse',
                '--port', String(config.get('serverPort') || 8000),
                '--host', 'localhost'
            ];

            // Add configuration from VS Code settings
            if (config.get('jiraUrl')) {
                args.push('--jira-url', config.get('jiraUrl') as string);
            }
            if (config.get('confluenceUrl')) {
                args.push('--confluence-url', config.get('confluenceUrl') as string);
            }
            if (config.get('readOnlyMode')) {
                args.push('--read-only');
            }
            if (config.get('verbose')) {
                args.push('--verbose');
            }

            this.outputChannel.appendLine(`Starting MCP server: node ${serverPath} ${args.join(' ')}`);

            this.serverProcess = spawn('node', [serverPath, ...args], {
                env: { ...process.env, ...this.getEnvironmentVariables() },
                cwd: path.dirname(serverPath)
            });

            this.serverProcess.stdout?.on('data', (data) => {
                this.outputChannel.appendLine(`[STDOUT] ${data}`);
            });

            this.serverProcess.stderr?.on('data', (data) => {
                this.outputChannel.appendLine(`[STDERR] ${data}`);
            });

            this.serverProcess.on('close', (code) => {
                this.outputChannel.appendLine(`Server exited with code ${code}`);
                this.serverProcess = null;
                this.updateStatusBar(false);
                if (code !== 0) {
                    vscode.window.showErrorMessage(`MCP Server exited with code ${code}. Check output for details.`);
                }
            });

            this.serverProcess.on('error', (error) => {
                this.outputChannel.appendLine(`Server error: ${error.message}`);
                this.serverProcess = null;
                this.updateStatusBar(false);
                vscode.window.showErrorMessage(`Failed to start MCP server: ${error.message}`);
            });

            this.updateStatusBar(true);
            this.outputChannel.appendLine('MCP Server started successfully');
            this.outputChannel.show(true);
            vscode.window.showInformationMessage('Atlassian MCP Server started successfully');

        } catch (error) {
            this.outputChannel.appendLine(`Failed to start server: ${error}`);
            vscode.window.showErrorMessage(`Failed to start MCP server: ${error}`);
        }
    }

    stopServer(): void {
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
            setTimeout(() => {
                if (this.serverProcess && !this.serverProcess.killed) {
                    this.serverProcess.kill('SIGKILL');
                }
            }, 5000);
            
            this.serverProcess = null;
            this.updateStatusBar(false);
            this.outputChannel.appendLine('MCP Server stopped');
            vscode.window.showInformationMessage('Atlassian MCP Server stopped');
        } else {
            vscode.window.showWarningMessage('MCP Server is not running');
        }
    }

    async restartServer(): Promise<void> {
        this.outputChannel.appendLine('Restarting MCP Server...');
        this.stopServer();
        
        // Wait a moment for the process to fully stop
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.startServer();
    }

    isRunning(): boolean {
        return this.serverProcess !== null && !this.serverProcess.killed;
    }

    async runOAuthSetup(): Promise<void> {
        try {
            const serverPath = this.getServerPath();
            if (!serverPath) {
                const message = 'MCP server not found. Please ensure the server is bundled with the extension.';
                this.outputChannel.appendLine(`OAuth setup failed: ${message}`);
                vscode.window.showErrorMessage(message);
                return;
            }

            // Check if the server file actually exists
            const fs = require('fs');
            if (!fs.existsSync(serverPath)) {
                const message = `Server file not found at: ${serverPath}`;
                this.outputChannel.appendLine(`OAuth setup failed: ${message}`);
                vscode.window.showErrorMessage(message);
                return;
            }

            // Try web-based OAuth setup first (simpler and more reliable)
            const useWebSetup = await vscode.window.showQuickPick(
                ['Web-based setup (Recommended)', 'Terminal-based setup'],
                {
                    placeHolder: 'Choose OAuth setup method',
                    ignoreFocusOut: true
                }
            );

            if (!useWebSetup) {
                return; // User cancelled
            }

            if (useWebSetup.startsWith('Web-based')) {
                await this.runWebOAuthSetup();
            } else {
                await this.runTerminalOAuthSetup(serverPath);
            }

        } catch (error) {
            const message = `Failed to start OAuth setup: ${error}`;
            this.outputChannel.appendLine(message);
            vscode.window.showErrorMessage(message);
            this.outputChannel.show();
        }
    }

    private async runWebOAuthSetup(): Promise<void> {
        this.outputChannel.appendLine('Starting web-based OAuth setup...');

        // Get OAuth configuration from user
        const clientId = await vscode.window.showInputBox({
            prompt: 'Enter your OAuth Client ID',
            placeHolder: 'Your Atlassian OAuth client ID',
            ignoreFocusOut: true
        });

        if (!clientId) {
            vscode.window.showWarningMessage('OAuth setup cancelled - Client ID is required');
            return;
        }

        const clientSecret = await vscode.window.showInputBox({
            prompt: 'Enter your OAuth Client Secret',
            placeHolder: 'Your Atlassian OAuth client secret',
            password: true,
            ignoreFocusOut: true
        });

        if (!clientSecret) {
            vscode.window.showWarningMessage('OAuth setup cancelled - Client Secret is required');
            return;
        }

        const scope = await vscode.window.showInputBox({
            prompt: 'Enter OAuth scopes (space-separated)',
            value: 'read:jira-work write:jira-work read:confluence-content.all write:confluence-content offline_access',
            ignoreFocusOut: true
        });

        if (!scope) {
            vscode.window.showWarningMessage('OAuth setup cancelled - Scope is required');
            return;
        }

        try {
            // Create callback server
            const http = require('http');
            const url = require('url');
            const axios = require('axios');

            const port = 8080;
            const redirectUri = `http://localhost:${port}/callback`;

            const server = http.createServer((req: any, res: any) => {
                const parsedUrl = url.parse(req.url, true);
                
                if (parsedUrl.pathname === '/callback') {
                    const code = parsedUrl.query.code;
                    const error = parsedUrl.query.error;
                    
                    if (error) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end(`<html><body><h1>❌ Authorization Failed</h1><p>Error: ${error}</p></body></html>`);
                        server.close();
                        vscode.window.showErrorMessage(`OAuth authorization failed: ${error}`);
                        return;
                    }
                    
                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(`<html><body><h1>✅ Authorization Successful</h1><p>You can close this window and return to VS Code.</p></body></html>`);
                        server.close();
                        
                        // Exchange code for tokens
                        this.exchangeOAuthCode(clientId, clientSecret, code, redirectUri);
                        return;
                    }
                }
                
                res.writeHead(404);
                res.end('Not Found');
            });

            server.listen(port, 'localhost', () => {
                this.outputChannel.appendLine(`OAuth callback server started on http://localhost:${port}`);
                
                // Generate authorization URL
                const params = new URLSearchParams({
                    audience: 'api.atlassian.com',
                    client_id: clientId,
                    scope: scope,
                    redirect_uri: redirectUri,
                    state: Math.random().toString(36).substring(7),
                    response_type: 'code',
                    prompt: 'consent'
                });
                
                const authUrl = `https://auth.atlassian.com/authorize?${params.toString()}`;
                
                this.outputChannel.appendLine(`Opening authorization URL: ${authUrl}`);
                vscode.env.openExternal(vscode.Uri.parse(authUrl));
                
                vscode.window.showInformationMessage(
                    'OAuth authorization page opened in your browser. Complete the authorization and return to VS Code.',
                    'Show Output'
                ).then(selection => {
                    if (selection === 'Show Output') {
                        this.outputChannel.show();
                    }
                });
            });

            server.on('error', (error: any) => {
                if (error.code === 'EADDRINUSE') {
                    vscode.window.showErrorMessage(`Port ${port} is already in use. Please close other applications using this port and try again.`);
                } else {
                    vscode.window.showErrorMessage(`Failed to start OAuth server: ${error.message}`);
                }
            });

            // Timeout after 5 minutes
            setTimeout(() => {
                server.close();
                this.outputChannel.appendLine('OAuth setup timed out after 5 minutes');
            }, 5 * 60 * 1000);

        } catch (error) {
            this.outputChannel.appendLine(`Web OAuth setup failed: ${error}`);
            vscode.window.showErrorMessage(`OAuth setup failed: ${error}`);
        }
    }

    private async exchangeOAuthCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<void> {
        try {
            const axios = require('axios');
            
            this.outputChannel.appendLine('Exchanging authorization code for tokens...');
            
            const response = await axios.post('https://auth.atlassian.com/oauth/token', {
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const tokens = response.data;
            
            // Get cloud ID
            const resourcesResponse = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`,
                    'Accept': 'application/json'
                }
            });
            
            const resources = resourcesResponse.data;
            let cloudId = '';
            
            if (resources.length === 0) {
                throw new Error('No accessible Atlassian resources found');
            } else if (resources.length === 1) {
                cloudId = resources[0].id;
                this.outputChannel.appendLine(`Auto-detected Cloud ID: ${cloudId} (${resources[0].name})`);
            } else {
                // For now, use the first resource
                cloudId = resources[0].id;
                this.outputChannel.appendLine(`Using first resource: ${resources[0].name} (${cloudId})`);
            }
            
            // Display results
            this.outputChannel.appendLine('\n🎉 OAuth setup completed successfully!');
            this.outputChannel.appendLine('\nAdd these environment variables to your .env file:');
            this.outputChannel.appendLine(`ATLASSIAN_OAUTH_CLIENT_ID=${clientId}`);
            this.outputChannel.appendLine(`ATLASSIAN_OAUTH_CLIENT_SECRET=${clientSecret}`);
            this.outputChannel.appendLine(`ATLASSIAN_OAUTH_CLOUD_ID=${cloudId}`);
            this.outputChannel.appendLine(`ATLASSIAN_OAUTH_ACCESS_TOKEN=${tokens.access_token}`);
            if (tokens.refresh_token) {
                this.outputChannel.appendLine(`ATLASSIAN_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
            }
            
            const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
            const confluenceUrl = `https://api.atlassian.com/ex/confluence/${cloudId}`;
            
            this.outputChannel.appendLine('\nYour Atlassian URLs for configuration:');
            this.outputChannel.appendLine(`JIRA_URL=${baseUrl}`);
            this.outputChannel.appendLine(`CONFLUENCE_URL=${confluenceUrl}/wiki`);
            
            this.outputChannel.show();
            
            vscode.window.showInformationMessage(
                'OAuth setup completed successfully! Check the output panel for your configuration variables.',
                'Show Output',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Show Output') {
                    this.outputChannel.show();
                } else if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'atlassianMcp');
                }
            });
            
        } catch (error: any) {
            const message = `Failed to exchange OAuth code: ${error.response?.data?.error_description || error.message}`;
            this.outputChannel.appendLine(message);
            vscode.window.showErrorMessage(message);
        }
    }

    private async runTerminalOAuthSetup(serverPath: string): Promise<void> {
        this.outputChannel.appendLine('Starting terminal-based OAuth setup...');
        this.outputChannel.appendLine(`Server path: ${serverPath}`);
        
        // Try to run the OAuth setup directly and capture output
        const { spawn } = require('child_process');
        const process = spawn('node', [serverPath, '--oauth-setup'], {
            cwd: require('path').dirname(serverPath)
        });

        let hasOutput = false;

        process.stdout?.on('data', (data: Buffer) => {
            hasOutput = true;
            const output = data.toString();
            this.outputChannel.appendLine(`[OAuth Setup] ${output}`);
        });

        process.stderr?.on('data', (data: Buffer) => {
            hasOutput = true;
            const output = data.toString();
            this.outputChannel.appendLine(`[OAuth Setup Error] ${output}`);
        });

        process.on('close', (code: number) => {
            this.outputChannel.appendLine(`OAuth setup process exited with code: ${code}`);
            if (code !== 0) {
                vscode.window.showErrorMessage(`OAuth setup failed with exit code ${code}. Check the output panel for details.`);
            }
            this.outputChannel.show();
        });

        process.on('error', (error: Error) => {
            this.outputChannel.appendLine(`OAuth setup process error: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to start OAuth setup: ${error.message}`);
            this.outputChannel.show();
        });

        // Show output panel and inform user
        this.outputChannel.show();
        vscode.window.showInformationMessage(
            'OAuth setup wizard is running in the background. Check the output panel for progress and follow the instructions.',
            'Show Output'
        ).then(selection => {
            if (selection === 'Show Output') {
                this.outputChannel.show();
            }
        });

        // Also create a terminal for interactive input if needed
        setTimeout(() => {
            if (!hasOutput) {
                this.outputChannel.appendLine('No output received yet. Creating interactive terminal...');
                const terminal = vscode.window.createTerminal({
                    name: 'Atlassian OAuth Setup',
                    cwd: require('path').dirname(serverPath)
                });
                
                terminal.sendText(`node "${serverPath}" --oauth-setup`);
                terminal.show();
            }
        }, 3000);
    }

    private getServerPath(): string | null {
        // Try bundled server first
        const bundledPath = path.join(this.context.extensionPath, 'server-dist', 'index.js');
        
        // Alternative: look for globally installed server
        // const globalPath = which.sync('mcp-atlassian', { nothrow: true });
        
        try {
            const fs = require('fs');
            if (fs.existsSync(bundledPath)) {
                return bundledPath;
            }
        } catch (error) {
            this.outputChannel.appendLine(`Server path check failed: ${error}`);
        }
        
        return null;
    }

    private getEnvironmentVariables(): Record<string, string> {
        const config = vscode.workspace.getConfiguration('atlassianMcp');
        const env: Record<string, string> = {
            MCP_VERBOSE: config.get('verbose') ? 'true' : 'false'
        };

        // Add credentials from secure storage if available
        // Note: In a real implementation, you'd want to use VS Code's SecretStorage API
        // for storing sensitive information like API tokens
        
        return env;
    }

    private updateStatusBar(running: boolean): void {
        if (running) {
            this.statusBarItem.text = '$(server) MCP: Running';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            this.statusBarItem.command = 'atlassianMcp.stop';
            this.statusBarItem.tooltip = 'Atlassian MCP Server is running - Click to stop';
        } else {
            this.statusBarItem.text = '$(server) MCP: Stopped';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.command = 'atlassianMcp.configure';
            this.statusBarItem.tooltip = 'Atlassian MCP Server is stopped - Click to configure';
        }
    }

    showOutput(): void {
        this.outputChannel.show();
    }
} 