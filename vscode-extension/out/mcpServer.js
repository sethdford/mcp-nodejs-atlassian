"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServerManager = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
class McpServerManager {
    constructor(context) {
        this.context = context;
        this.serverProcess = null;
        this.outputChannel = vscode.window.createOutputChannel('Atlassian MCP Server');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = '$(server) MCP: Stopped';
        this.statusBarItem.command = 'atlassianMcp.configure';
        this.statusBarItem.tooltip = 'Atlassian MCP Server Status';
        this.statusBarItem.show();
        context.subscriptions.push(this.outputChannel, this.statusBarItem);
    }
    async startServer() {
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
                args.push('--jira-url', config.get('jiraUrl'));
            }
            if (config.get('confluenceUrl')) {
                args.push('--confluence-url', config.get('confluenceUrl'));
            }
            if (config.get('readOnlyMode')) {
                args.push('--read-only');
            }
            if (config.get('verbose')) {
                args.push('--verbose');
            }
            this.outputChannel.appendLine(`Starting MCP server: node ${serverPath} ${args.join(' ')}`);
            this.serverProcess = (0, child_process_1.spawn)('node', [serverPath, ...args], {
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
        }
        catch (error) {
            this.outputChannel.appendLine(`Failed to start server: ${error}`);
            vscode.window.showErrorMessage(`Failed to start MCP server: ${error}`);
        }
    }
    stopServer() {
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
        }
        else {
            vscode.window.showWarningMessage('MCP Server is not running');
        }
    }
    async restartServer() {
        this.outputChannel.appendLine('Restarting MCP Server...');
        this.stopServer();
        // Wait a moment for the process to fully stop
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.startServer();
    }
    isRunning() {
        return this.serverProcess !== null && !this.serverProcess.killed;
    }
    async runOAuthSetup() {
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
            vscode.window.showInformationMessage('OAuth setup wizard started in terminal. Follow the instructions to complete authentication.', 'Open Terminal').then(selection => {
                if (selection === 'Open Terminal') {
                    terminal.show();
                }
            });
        }
        catch (error) {
            this.outputChannel.appendLine(`Failed to start OAuth setup: ${error}`);
            vscode.window.showErrorMessage(`Failed to start OAuth setup: ${error}`);
        }
    }
    getServerPath() {
        // Try bundled server first
        const bundledPath = path.join(this.context.extensionPath, 'server-dist', 'index.js');
        // Alternative: look for globally installed server
        // const globalPath = which.sync('mcp-atlassian', { nothrow: true });
        try {
            const fs = require('fs');
            if (fs.existsSync(bundledPath)) {
                return bundledPath;
            }
        }
        catch (error) {
            this.outputChannel.appendLine(`Server path check failed: ${error}`);
        }
        return null;
    }
    getEnvironmentVariables() {
        const config = vscode.workspace.getConfiguration('atlassianMcp');
        const env = {
            MCP_VERBOSE: config.get('verbose') ? 'true' : 'false'
        };
        // Add credentials from secure storage if available
        // Note: In a real implementation, you'd want to use VS Code's SecretStorage API
        // for storing sensitive information like API tokens
        return env;
    }
    updateStatusBar(running) {
        if (running) {
            this.statusBarItem.text = '$(server) MCP: Running';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            this.statusBarItem.command = 'atlassianMcp.stop';
            this.statusBarItem.tooltip = 'Atlassian MCP Server is running - Click to stop';
        }
        else {
            this.statusBarItem.text = '$(server) MCP: Stopped';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.command = 'atlassianMcp.configure';
            this.statusBarItem.tooltip = 'Atlassian MCP Server is stopped - Click to configure';
        }
    }
    showOutput() {
        this.outputChannel.show();
    }
}
exports.McpServerManager = McpServerManager;
//# sourceMappingURL=mcpServer.js.map