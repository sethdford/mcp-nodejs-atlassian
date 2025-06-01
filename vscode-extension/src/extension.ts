import * as vscode from 'vscode';
import { McpServerManager } from './mcpServer';
import { AtlassianProvider } from './atlassianProvider';
import { AtlassianTreeProvider } from './treeProvider';
import { WebviewManager } from './webviewManager';

let mcpManager: McpServerManager;
let atlassianProvider: AtlassianProvider;
let treeProvider: AtlassianTreeProvider;
let webviewManager: WebviewManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Atlassian MCP extension is now active');

    // Initialize managers
    mcpManager = new McpServerManager(context);
    atlassianProvider = new AtlassianProvider();
    treeProvider = new AtlassianTreeProvider(atlassianProvider);
    webviewManager = new WebviewManager(context);

    // Register tree data provider
    const treeView = vscode.window.createTreeView('atlassianMcp', { 
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });

    // Enable the view
    vscode.commands.executeCommand('setContext', 'atlassianMcp.enabled', true);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('atlassianMcp.configure', () => {
            webviewManager.showConfigurationWebview();
        }),

        vscode.commands.registerCommand('atlassianMcp.start', () => {
            mcpManager.startServer();
        }),

        vscode.commands.registerCommand('atlassianMcp.stop', () => {
            mcpManager.stopServer();
        }),

        vscode.commands.registerCommand('atlassianMcp.restart', () => {
            mcpManager.restartServer();
        }),

        vscode.commands.registerCommand('atlassianMcp.refresh', () => {
            treeProvider.refresh();
        }),

        vscode.commands.registerCommand('atlassianMcp.oauthSetup', async () => {
            await mcpManager.runOAuthSetup();
        }),

        vscode.commands.registerCommand('atlassianMcp.searchJira', async (project?: any) => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter JQL query to search Jira issues',
                placeHolder: project ? `project = ${project.key}` : 'project = YOUR_PROJECT'
            });
            
            if (query) {
                const results = await atlassianProvider.searchJiraIssues(query);
                webviewManager.showSearchResults('Jira Issues', results);
            }
        }),

        vscode.commands.registerCommand('atlassianMcp.searchConfluence', async (space?: any) => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter CQL query to search Confluence',
                placeHolder: space ? `space = ${space.key}` : 'type = page'
            });
            
            if (query) {
                const results = await atlassianProvider.searchConfluence(query);
                webviewManager.showSearchResults('Confluence Pages', results);
            }
        }),

        vscode.commands.registerCommand('atlassianMcp.openJiraProject', (project: any) => {
            vscode.env.openExternal(vscode.Uri.parse(`${project.self}`));
        }),

        vscode.commands.registerCommand('atlassianMcp.openConfluenceSpace', (space: any) => {
            const config = vscode.workspace.getConfiguration('atlassianMcp');
            const confluenceUrl = config.get('confluenceUrl') as string;
            if (confluenceUrl) {
                vscode.env.openExternal(vscode.Uri.parse(`${confluenceUrl}/spaces/${space.key}`));
            }
        })
    ];

    // Auto-start server if enabled
    const config = vscode.workspace.getConfiguration('atlassianMcp');
    if (config.get('autoStart')) {
        mcpManager.startServer();
    }

    // Listen for configuration changes
    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('atlassianMcp')) {
            treeProvider.refresh();
            if (e.affectsConfiguration('atlassianMcp.autoStart')) {
                const newAutoStart = vscode.workspace.getConfiguration('atlassianMcp').get('autoStart');
                if (newAutoStart && !mcpManager.isRunning()) {
                    mcpManager.startServer();
                }
            }
        }
    });

    context.subscriptions.push(treeView, configWatcher, ...commands);
}

export function deactivate() {
    if (mcpManager) {
        mcpManager.stopServer();
    }
} 