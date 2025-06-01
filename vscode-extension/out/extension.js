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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const mcpServer_1 = require("./mcpServer");
const atlassianProvider_1 = require("./atlassianProvider");
const treeProvider_1 = require("./treeProvider");
const webviewManager_1 = require("./webviewManager");
let mcpManager;
let atlassianProvider;
let treeProvider;
let webviewManager;
function activate(context) {
    console.log('Atlassian MCP extension is now active');
    // Initialize managers
    mcpManager = new mcpServer_1.McpServerManager(context);
    atlassianProvider = new atlassianProvider_1.AtlassianProvider();
    treeProvider = new treeProvider_1.AtlassianTreeProvider(atlassianProvider);
    webviewManager = new webviewManager_1.WebviewManager(context);
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
        vscode.commands.registerCommand('atlassianMcp.searchJira', async (project) => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter JQL query to search Jira issues',
                placeHolder: project ? `project = ${project.key}` : 'project = YOUR_PROJECT'
            });
            if (query) {
                const results = await atlassianProvider.searchJiraIssues(query);
                webviewManager.showSearchResults('Jira Issues', results);
            }
        }),
        vscode.commands.registerCommand('atlassianMcp.searchConfluence', async (space) => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter CQL query to search Confluence',
                placeHolder: space ? `space = ${space.key}` : 'type = page'
            });
            if (query) {
                const results = await atlassianProvider.searchConfluence(query);
                webviewManager.showSearchResults('Confluence Pages', results);
            }
        }),
        vscode.commands.registerCommand('atlassianMcp.openJiraProject', (project) => {
            vscode.env.openExternal(vscode.Uri.parse(`${project.self}`));
        }),
        vscode.commands.registerCommand('atlassianMcp.openConfluenceSpace', (space) => {
            const config = vscode.workspace.getConfiguration('atlassianMcp');
            const confluenceUrl = config.get('confluenceUrl');
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
exports.activate = activate;
function deactivate() {
    if (mcpManager) {
        mcpManager.stopServer();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map