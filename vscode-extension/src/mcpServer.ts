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
                throw new Error('MCP server not found');
            }

            this.outputChannel.appendLine('Starting OAuth setup wizard...');
            
            const terminal = vscode.window.createTerminal({
                name: 'Atlassian OAuth Setup',
                cwd: path.dirname(serverPath)
            });
            
            terminal.sendText(`node "${serverPath}" --oauth-setup`);
            terminal.show();
            
            vscode.window.showInformationMessage(
                'OAuth setup wizard started in terminal. Follow the instructions to complete authentication.',
                'Open Terminal'
            ).then(selection => {
                if (selection === 'Open Terminal') {
                    terminal.show();
                }
            });

        } catch (error) {
            this.outputChannel.appendLine(`Failed to start OAuth setup: ${error}`);
            vscode.window.showErrorMessage(`Failed to start OAuth setup: ${error}`);
        }
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