# Atlassian MCP Server Extension

![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Extension-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A VS Code extension that seamlessly connects your development environment to Atlassian (Jira & Confluence) using the Model Context Protocol (MCP). Enable AI assistants like GitHub Copilot to access your project data for smarter code suggestions and automated workflows.

## ✨ Features

- **🚀 One-Click Setup**: Interactive OAuth 2.0 setup wizard
- **🔍 Integrated Search**: Search Jira issues and Confluence pages directly from VS Code
- **🌳 Project Browser**: Visual tree view of your Jira projects and Confluence spaces
- **⚡ Auto-Start Server**: Automatically manages the MCP server lifecycle
- **🔐 Secure Authentication**: Support for OAuth 2.0, API tokens, and Personal Access Tokens
- **📊 Real-time Status**: Status bar integration showing server health
- **🎯 AI Integration**: Enable GitHub Copilot and other AI tools to understand your Atlassian data

## 📥 Installation

### Method 1: VS Code Marketplace (Coming Soon)
1. Open VS Code Extensions (`Cmd/Ctrl + Shift + X`)
2. Search for "Atlassian MCP Server"
3. Click "Install"

### Method 2: Manual Installation (Available Now)
1. Download the latest [VSIX package](https://github.com/sethdford/mcp-nodejs-atlassian/releases/latest/download/atlassian-mcp-server-1.0.0.vsix)
2. Open VS Code Extensions (`Cmd/Ctrl + Shift + X`)
3. Click the `⋯` menu → "Install from VSIX..."
4. Select the downloaded `.vsix` file

## 🚀 Quick Start

1. **Install Extension**: Use one of the installation methods above
2. **Configure Connection**: Run the command `Atlassian: Configure Atlassian MCP`
3. **OAuth Setup**: Click "OAuth Setup Wizard" for guided authentication
4. **Start Coding**: Your AI assistant now has access to your Atlassian data!

## 📋 Prerequisites

- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 18 or higher (automatically bundled with extension)
- **Atlassian Access**: Jira and/or Confluence (Cloud, Server, or Data Center)

## 🔧 Configuration

### Quick Configuration

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run `Atlassian: Configure Atlassian MCP`
3. Fill in your instance URLs:
   - **Jira**: `https://your-company.atlassian.net`
   - **Confluence**: `https://your-company.atlassian.net/wiki`

### Authentication Methods

#### 🔑 OAuth 2.0 (Recommended for Cloud)
- Click "OAuth Setup Wizard" in configuration panel
- Follow guided setup process
- Automatically creates OAuth app and exchanges tokens

#### 🎫 API Token (Cloud Alternative)
- Generate token at [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
- Enter username/email and API token

#### 🏢 Personal Access Token (Server/Data Center)
- Generate PAT in your Atlassian instance
- Enter token in configuration

## 🎮 Usage

### Tree View Navigation
- **Explorer Panel**: Browse Jira projects and Confluence spaces
- **Click Projects/Spaces**: Open in browser
- **Context Menu**: Search within specific projects/spaces

### Search Functionality
- `Atlassian: Search Jira Issues` - Use JQL queries
- `Atlassian: Search Confluence` - Use CQL queries
- **Example JQL**: `project = MYPROJ AND status = "In Progress"`
- **Example CQL**: `space = MYSPACE AND type = page`

### Server Management
- **Start/Stop**: Use status bar or commands
- **Restart**: `Atlassian: Restart MCP Server`
- **View Logs**: Check "Atlassian MCP Server" output channel

### AI Integration

Once configured, AI assistants can:
- **Understand Context**: Access your project requirements from Confluence
- **Smart Suggestions**: Generate code based on Jira issue descriptions
- **Automated Workflows**: Create issues, update status, add comments
- **Documentation**: Reference your team's knowledge base

Example prompts for GitHub Copilot:
```
// Generate a function to handle issue PROJ-123
// Create tests based on requirements in Confluence page "API Specs"
// Add error handling for the workflow described in PROJ-456
```

## ⚙️ Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `atlassianMcp.jiraUrl` | Jira instance URL | - |
| `atlassianMcp.confluenceUrl` | Confluence instance URL | - |
| `atlassianMcp.authMethod` | Authentication method | `oauth` |
| `atlassianMcp.autoStart` | Auto-start server on VS Code launch | `true` |
| `atlassianMcp.serverPort` | MCP server port | `8000` |
| `atlassianMcp.readOnlyMode` | Disable write operations | `false` |
| `atlassianMcp.verbose` | Enable debug logging | `false` |

## 🎯 Commands

| Command | Description |
|---------|-------------|
| `atlassianMcp.configure` | Open configuration panel |
| `atlassianMcp.start` | Start MCP server |
| `atlassianMcp.stop` | Stop MCP server |
| `atlassianMcp.restart` | Restart MCP server |
| `atlassianMcp.oauthSetup` | Run OAuth setup wizard |
| `atlassianMcp.searchJira` | Search Jira issues |
| `atlassianMcp.searchConfluence` | Search Confluence pages |
| `atlassianMcp.refresh` | Refresh tree view |

## 🚨 Troubleshooting

### Connection Issues
1. **Check URLs**: Ensure Jira/Confluence URLs are correct
2. **Test Connection**: Use "Test Connection" button in configuration
3. **Check Credentials**: Verify API tokens or OAuth setup
4. **View Logs**: Check "Atlassian MCP Server" output channel

### OAuth Setup Issues
1. **Callback URL**: Ensure `http://localhost:8080/callback` is configured in your OAuth app
2. **Scopes**: Check that all required scopes are granted
3. **Cloud ID**: Verify the correct Atlassian Cloud ID is detected

### Server Start Issues
1. **Port Conflicts**: Try changing `atlassianMcp.serverPort` setting
2. **Node.js**: Ensure Node.js 18+ is available in PATH
3. **Permissions**: Check file system permissions for extension directory

### AI Integration Issues
1. **Server Status**: Ensure MCP server is running (check status bar)
2. **VS Code Settings**: Verify AI tool is configured to use MCP
3. **Network**: Check firewall settings for localhost connections

## 🔒 Security & Privacy

- **Local Processing**: All data processing happens locally on your machine
- **Secure Storage**: Credentials stored using VS Code's secure storage API
- **No External Servers**: Extension communicates directly with your Atlassian instances
- **Audit Trail**: All actions logged in VS Code output channels

## 🆚 Alternative Usage

Don't want the extension? You can also use the standalone MCP server:

```bash
# Install standalone server
git clone https://github.com/sethdford/mcp-nodejs-atlassian.git
cd mcp-nodejs-atlassian
npm install && npm run build

# Start server
npm start -- --oauth-setup  # Setup OAuth
npm start                   # Run with stdio transport
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

## 📝 Changelog

### 1.0.0
- Initial release
- OAuth 2.0 setup wizard
- Jira and Confluence integration
- Tree view navigation
- Search functionality
- AI tool integration

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol enabling AI tool integration
- [Atlassian](https://www.atlassian.com/) - For their comprehensive APIs
- [VS Code](https://code.visualstudio.com/) - For the extensible editor platform

---

**Not affiliated with Atlassian, Inc. Atlassian, Jira, and Confluence are trademarks of Atlassian.** 