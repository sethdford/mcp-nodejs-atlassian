# Change Log

All notable changes to the "atlassian-mcp-server" extension will be documented in this file.

## [1.0.0] - 2024-12-XX

### Added
- 🎉 Initial release of Atlassian MCP Server extension
- 🔐 OAuth 2.0 setup wizard for Atlassian Cloud
- 🌳 Tree view showing Jira projects and Confluence spaces
- 🔍 Integrated search for Jira issues and Confluence pages
- ⚙️ Interactive configuration panel with connection testing
- 📊 Status bar integration showing MCP server status
- 🚀 Auto-start server option
- 🔧 Multiple authentication methods (OAuth, API Token, PAT)
- 📝 Comprehensive logging and troubleshooting support
- 🎯 AI integration support for GitHub Copilot and other tools

### Features
- **MCP Server Management**: Automatic lifecycle management of the Node.js MCP server
- **Visual Configuration**: User-friendly webview for setting up Atlassian connections
- **OAuth Wizard**: Guided OAuth 2.0 setup with automatic app creation
- **Search Integration**: Direct search capabilities from VS Code interface
- **Security**: Secure credential storage using VS Code's secure storage API
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Instances**: Support for both Jira and Confluence simultaneously

### Technical Details
- Built with TypeScript for type safety and better development experience
- Uses VS Code Extension API for native integration
- Bundles MCP server for zero-dependency installation
- Supports both Atlassian Cloud and Server/Data Center instances
- RESTful API integration with proper error handling and retries

### Known Issues
- OAuth setup requires local callback server on port 8080
- Some corporate firewalls may block localhost connections
- Large Confluence spaces may take time to load in tree view

### Future Plans
- GitHub integration for automatic issue creation from code comments
- Custom dashboard with project metrics
- Time tracking integration
- Advanced filtering and search capabilities
- Bulk operations support 