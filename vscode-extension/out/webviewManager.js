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
exports.WebviewManager = void 0;
const vscode = __importStar(require("vscode"));
class WebviewManager {
    constructor(context) {
        this.context = context;
    }
    showConfigurationWebview() {
        const panel = vscode.window.createWebviewPanel('atlassianConfig', 'Atlassian MCP Configuration', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [this.context.extensionUri]
        });
        panel.webview.html = this.getConfigurationHtml();
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'saveConfig':
                    await this.saveConfiguration(message.config);
                    vscode.window.showInformationMessage('Configuration saved successfully!');
                    panel.dispose();
                    break;
                case 'testConnection':
                    const success = await this.testConnection(message.config);
                    panel.webview.postMessage({
                        command: 'connectionResult',
                        success,
                        message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials.'
                    });
                    break;
                case 'loadConfig':
                    const currentConfig = this.getCurrentConfiguration();
                    panel.webview.postMessage({
                        command: 'configLoaded',
                        config: currentConfig
                    });
                    break;
            }
        }, undefined, this.context.subscriptions);
    }
    showSearchResults(title, results) {
        const panel = vscode.window.createWebviewPanel('atlassianResults', title, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: false
        });
        panel.webview.html = this.getSearchResultsHtml(title, results);
    }
    async saveConfiguration(config) {
        const vsConfig = vscode.workspace.getConfiguration('atlassianMcp');
        if (config.jiraUrl) {
            await vsConfig.update('jiraUrl', config.jiraUrl, vscode.ConfigurationTarget.Global);
        }
        if (config.confluenceUrl) {
            await vsConfig.update('confluenceUrl', config.confluenceUrl, vscode.ConfigurationTarget.Global);
        }
        if (config.authMethod) {
            await vsConfig.update('authMethod', config.authMethod, vscode.ConfigurationTarget.Global);
        }
        // Note: In a production extension, you'd want to use VS Code's SecretStorage API
        // for storing sensitive information like API tokens
        if (config.username) {
            await vsConfig.update('username', config.username, vscode.ConfigurationTarget.Global);
        }
        if (config.apiToken) {
            await vsConfig.update('apiToken', config.apiToken, vscode.ConfigurationTarget.Global);
        }
    }
    async testConnection(config) {
        // Import here to avoid circular dependencies
        const { AtlassianProvider } = await Promise.resolve().then(() => __importStar(require('./atlassianProvider')));
        const provider = new AtlassianProvider();
        return provider.testConnection(config);
    }
    getCurrentConfiguration() {
        const config = vscode.workspace.getConfiguration('atlassianMcp');
        return {
            jiraUrl: config.get('jiraUrl') || '',
            confluenceUrl: config.get('confluenceUrl') || '',
            authMethod: config.get('authMethod') || 'oauth',
            username: config.get('username') || '',
            apiToken: config.get('apiToken') || ''
        };
    }
    getConfigurationHtml() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Atlassian MCP Configuration</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.5;
                }
                .container { max-width: 600px; margin: 0 auto; }
                h1 { color: var(--vscode-foreground); margin-bottom: 30px; }
                .form-group { margin-bottom: 20px; }
                label { 
                    display: block; 
                    margin-bottom: 8px; 
                    font-weight: bold; 
                    color: var(--vscode-input-foreground);
                }
                input, select { 
                    width: 100%; 
                    padding: 8px 12px; 
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: inherit;
                    font-size: inherit;
                    box-sizing: border-box;
                }
                input:focus, select:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    border-color: var(--vscode-focusBorder);
                }
                button { 
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 10px 20px; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer;
                    margin-right: 10px;
                    margin-bottom: 10px;
                    font-family: inherit;
                    font-size: inherit;
                }
                button:hover { 
                    background-color: var(--vscode-button-hoverBackground);
                }
                button.secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                button.secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                .auth-section { 
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0; 
                    border: 1px solid var(--vscode-panel-border);
                }
                .status {
                    padding: 10px;
                    border-radius: 4px;
                    margin: 10px 0;
                    display: none;
                }
                .status.success {
                    background-color: var(--vscode-testing-iconPassed);
                    color: var(--vscode-editor-background);
                }
                .status.error {
                    background-color: var(--vscode-testing-iconFailed);
                    color: var(--vscode-editor-background);
                }
                .help-text {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 5px;
                }
                .oauth-help {
                    background-color: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-textBlockQuote-border);
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 0 4px 4px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔧 Atlassian MCP Configuration</h1>
                
                <div class="form-group">
                    <label for="jiraUrl">Jira URL</label>
                    <input type="url" id="jiraUrl" placeholder="https://your-company.atlassian.net">
                    <div class="help-text">Your Jira instance URL (Cloud or Server/Data Center)</div>
                </div>
                
                <div class="form-group">
                    <label for="confluenceUrl">Confluence URL</label>
                    <input type="url" id="confluenceUrl" placeholder="https://your-company.atlassian.net/wiki">
                    <div class="help-text">Your Confluence instance URL (include /wiki for Cloud)</div>
                </div>
                
                <div class="auth-section">
                    <h3>🔐 Authentication Method</h3>
                    <div class="form-group">
                        <label for="authMethod">Method</label>
                        <select id="authMethod">
                            <option value="oauth">OAuth 2.0 (Recommended for Cloud)</option>
                            <option value="token">API Token (Cloud)</option>
                            <option value="pat">Personal Access Token (Server/Data Center)</option>
                        </select>
                    </div>
                    
                    <div id="oauthFields">
                        <div class="oauth-help">
                            <strong>OAuth 2.0 Setup:</strong><br>
                            1. Click "OAuth Setup Wizard" below to configure OAuth automatically<br>
                            2. Or manually create an OAuth app at <a href="https://developer.atlassian.com/console/myapps/" target="_blank">Atlassian Developer Console</a>
                        </div>
                        <button type="button" onclick="runOAuthSetup()">🚀 OAuth Setup Wizard</button>
                    </div>
                    
                    <div id="tokenFields" style="display: none;">
                        <div class="form-group">
                            <label for="username">Username/Email</label>
                            <input type="email" id="username" placeholder="your.email@company.com">
                        </div>
                        <div class="form-group">
                            <label for="apiToken">API Token</label>
                            <input type="password" id="apiToken" placeholder="Your API Token">
                            <div class="help-text">Get your API token from <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank">Atlassian Account Settings</a></div>
                        </div>
                    </div>
                    
                    <div id="patFields" style="display: none;">
                        <div class="form-group">
                            <label for="patToken">Personal Access Token</label>
                            <input type="password" id="patToken" placeholder="Your Personal Access Token">
                            <div class="help-text">For Server/Data Center instances only</div>
                        </div>
                    </div>
                </div>
                
                <div class="status" id="status"></div>
                
                <div>
                    <button type="button" onclick="testConnection()">🔍 Test Connection</button>
                    <button type="button" onclick="saveConfiguration()">💾 Save Configuration</button>
                    <button type="button" class="secondary" onclick="window.close()">Cancel</button>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                // Load current configuration
                window.addEventListener('load', () => {
                    vscode.postMessage({ command: 'loadConfig' });
                });
                
                document.getElementById('authMethod').addEventListener('change', (e) => {
                    const method = e.target.value;
                    document.getElementById('oauthFields').style.display = method === 'oauth' ? 'block' : 'none';
                    document.getElementById('tokenFields').style.display = method === 'token' ? 'block' : 'none';
                    document.getElementById('patFields').style.display = method === 'pat' ? 'block' : 'none';
                });
                
                function runOAuthSetup() {
                    vscode.postMessage({ command: 'oauthSetup' });
                }
                
                function testConnection() {
                    const config = getFormData();
                    showStatus('Testing connection...', 'info');
                    vscode.postMessage({ command: 'testConnection', config });
                }
                
                function saveConfiguration() {
                    const config = getFormData();
                    vscode.postMessage({ command: 'saveConfig', config });
                }
                
                function getFormData() {
                    const authMethod = document.getElementById('authMethod').value;
                    return {
                        jiraUrl: document.getElementById('jiraUrl').value,
                        confluenceUrl: document.getElementById('confluenceUrl').value,
                        authMethod,
                        username: authMethod === 'token' ? document.getElementById('username').value : '',
                        apiToken: authMethod === 'token' ? document.getElementById('apiToken').value : 
                                 authMethod === 'pat' ? document.getElementById('patToken').value : ''
                    };
                }
                
                function showStatus(message, type) {
                    const status = document.getElementById('status');
                    status.textContent = message;
                    status.className = 'status ' + type;
                    status.style.display = 'block';
                }
                
                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.command === 'connectionResult') {
                        showStatus(message.message, message.success ? 'success' : 'error');
                    } else if (message.command === 'configLoaded') {
                        const config = message.config;
                        document.getElementById('jiraUrl').value = config.jiraUrl;
                        document.getElementById('confluenceUrl').value = config.confluenceUrl;
                        document.getElementById('authMethod').value = config.authMethod;
                        document.getElementById('username').value = config.username;
                        document.getElementById('apiToken').value = config.apiToken;
                        document.getElementById('patToken').value = config.apiToken;
                        
                        // Trigger change event to show/hide appropriate fields
                        document.getElementById('authMethod').dispatchEvent(new Event('change'));
                    }
                });
            </script>
        </body>
        </html>`;
    }
    getSearchResultsHtml(title, results) {
        const resultsHtml = results.map(result => {
            if (title.includes('Jira')) {
                return `
                    <div class="result-item">
                        <h3><a href="${result.self}" target="_blank">${result.key}: ${result.fields.summary}</a></h3>
                        <p><strong>Status:</strong> ${result.fields.status.name}</p>
                        <p><strong>Type:</strong> ${result.fields.issuetype.name}</p>
                        <p><strong>Assignee:</strong> ${result.fields.assignee?.displayName || 'Unassigned'}</p>
                    </div>
                `;
            }
            else {
                return `
                    <div class="result-item">
                        <h3><a href="${result._links.webui}" target="_blank">${result.title}</a></h3>
                        <p><strong>Space:</strong> ${result.space?.name || 'Unknown'}</p>
                        <p><strong>Type:</strong> ${result.type}</p>
                    </div>
                `;
            }
        }).join('');
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                h1 { margin-bottom: 20px; }
                .result-item {
                    border: 1px solid var(--vscode-panel-border);
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 4px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                }
                .result-item h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                }
                .result-item a {
                    color: var(--vscode-textLink-foreground);
                    text-decoration: none;
                }
                .result-item a:hover {
                    text-decoration: underline;
                }
                .no-results {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    padding: 40px;
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            ${results.length > 0 ? resultsHtml : '<div class="no-results">No results found</div>'}
        </body>
        </html>`;
    }
}
exports.WebviewManager = WebviewManager;
//# sourceMappingURL=webviewManager.js.map