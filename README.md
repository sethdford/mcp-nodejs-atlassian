# MCP Atlassian Server (Node.js)

A Model Context Protocol (MCP) server that provides AI assistants with read and write access to Atlassian Jira and Confluence. This implementation offers a **simple command-line setup** with OAuth 2.0 support for secure authentication.

## 🚀 Quick Start (5 minutes)

1. **Clone and install:**
```bash
git clone https://github.com/your-username/mcp-nodejs-atlassian.git
cd mcp-nodejs-atlassian
npm install
npm run build
```

2. **Set up OAuth authentication (recommended):**
```bash
npm run oauth-setup
```
This launches an interactive wizard that:
- Walks you through creating an Atlassian OAuth app
- Handles the complete OAuth flow in your browser
- Auto-generates all configuration variables
- Updates your `.env` file automatically

3. **Start the MCP server:**
```bash
npm start
```

That's it! Your MCP server is now running and ready to integrate with AI assistants.

## 🔧 Authentication Options

### Option 1: OAuth 2.0 Setup (Recommended)

The OAuth setup wizard makes authentication simple:

```bash
npm run oauth-setup
```

**What it does:**
- Guides you through creating an OAuth app in Atlassian Developer Console
- Opens your browser for secure authorization
- Automatically exchanges tokens and detects your Cloud ID
- Generates all required environment variables
- No manual configuration needed!

**Requirements:**
- An Atlassian Cloud account
- 2 minutes to create an OAuth app
- Port 8080 available for the callback server

### Option 2: Manual API Token Setup

If you prefer manual setup or need API tokens:

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your credentials
# Get tokens from: https://id.atlassian.com/manage-profile/security/api-tokens
```

**For Atlassian Cloud:**
```bash
CONFLUENCE_URL=https://your-company.atlassian.net/wiki
CONFLUENCE_USERNAME=your.email@company.com
CONFLUENCE_API_TOKEN=your_confluence_api_token
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your.email@company.com
JIRA_API_TOKEN=your_jira_api_token
```

**For Atlassian Server/Data Center:**
```bash
CONFLUENCE_URL=https://confluence.your-company.com
CONFLUENCE_PERSONAL_TOKEN=your_confluence_pat
JIRA_URL=https://jira.your-company.com
JIRA_PERSONAL_TOKEN=your_jira_pat
```

## 🤖 AI Assistant Integration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-nodejs-atlassian/dist/index.js"],
      "env": {
        "CONFLUENCE_URL": "https://your-company.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "your.email@company.com", 
        "CONFLUENCE_API_TOKEN": "your_api_token",
        "JIRA_URL": "https://your-company.atlassian.net",
        "JIRA_USERNAME": "your.email@company.com",
        "JIRA_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

### Cursor IDE

1. Open Settings → MCP → Add new global MCP server
2. **Command:** `node`
3. **Args:** `["/absolute/path/to/mcp-nodejs-atlassian/dist/index.js"]`
4. **Environment:** Add your Atlassian credentials

### Any MCP-Compatible AI Assistant

The server uses standard MCP protocols and works with any compatible AI assistant:

```bash
# Default stdio transport (most common)
npm start

# HTTP Server for web integrations
npm start -- --transport sse --port 8000
npm start -- --transport streamable-http --port 8000
```

## 🛠️ Advanced Configuration

### Command-Line Options

```bash
# Get help
node dist/index.js --help

# OAuth setup wizard
node dist/index.js --oauth-setup

# Custom environment file
node dist/index.js --env-file /path/to/custom.env

# Read-only mode (no write operations)
node dist/index.js --read-only

# Enable specific tools only
node dist/index.js --enabled-tools "confluence_search,jira_get_issue"

# Verbose logging
node dist/index.js --verbose

# HTTP transports
node dist/index.js --transport sse --port 8000
node dist/index.js --transport streamable-http --port 8000 --path /mcp
```

### Environment Variables

You can pass credentials via command line instead of `.env` file:

```bash
node dist/index.js \
  --confluence-url "https://company.atlassian.net/wiki" \
  --confluence-username "user@company.com" \
  --confluence-token "your_token" \
  --jira-url "https://company.atlassian.net" \
  --jira-username "user@company.com" \
  --jira-token "your_token"
```

### Filtering and Security

```bash
# Limit access to specific spaces/projects
CONFLUENCE_SPACES_FILTER=DEV,TEAM,DOC
JIRA_PROJECTS_FILTER=PROJ,DEV,SUPPORT

# Read-only mode for safety
READ_ONLY_MODE=true

# Enable verbose logging
MCP_VERBOSE=true
```

## 📚 Available Tools

Once configured, your AI assistant can:

### Confluence
- **confluence_search** - Search across all accessible Confluence content
- **confluence_get_page** - Retrieve specific pages by ID or title
- **confluence_create_page** - Create new pages with content
- **confluence_update_page** - Update existing page content

### Jira  
- **jira_search_issues** - Search for issues using JQL
- **jira_get_issue** - Get detailed issue information
- **jira_create_issue** - Create new issues
- **jira_update_issue** - Update existing issues

## 🔍 Usage Examples

Ask your AI assistant things like:

- *"Search Confluence for API documentation about user authentication"*
- *"Get the details of Jira issue PROJ-123"*
- *"Create a new bug report in the MOBILE project"*
- *"Find all open issues assigned to me in the last sprint"*
- *"Update the status of PROJ-456 to In Progress"*
- *"Search for Confluence pages about deployment procedures"*

## 🏢 Enterprise Features

### Authentication Methods
- ✅ **OAuth 2.0** - Secure, user-delegated access (Cloud)
- ✅ **API Tokens** - Simple token-based auth (Cloud)  
- ✅ **Personal Access Tokens** - For Server/Data Center
- ✅ **Command-line credential passing** - For containerized deployments

### Security & Compliance
- ✅ **Read-only mode** - Prevent accidental modifications
- ✅ **Space/Project filtering** - Limit access scope
- ✅ **Credential isolation** - Environment-based configuration
- ✅ **Audit logging** - Track all API operations

### Deployment Options
- ✅ **Local development** - Simple `npm start`
- ✅ **Containerized** - Docker-ready with environment variables
- ✅ **HTTP servers** - SSE and Streamable HTTP transports
- ✅ **Multiple transports** - stdio, SSE, HTTP

## 🐳 Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 8000
CMD ["node", "dist/index.js", "--transport", "sse", "--port", "8000", "--host", "0.0.0.0"]
```

```bash
# Build and run
docker build -t mcp-atlassian .
docker run -p 8000:8000 \
  -e CONFLUENCE_URL="https://company.atlassian.net/wiki" \
  -e CONFLUENCE_API_TOKEN="your_token" \
  -e JIRA_URL="https://company.atlassian.net" \
  -e JIRA_API_TOKEN="your_token" \
  mcp-atlassian
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Model Context Protocol Specification](https://modelcontextprotocol.io/introduction)
- [Atlassian Developer Documentation](https://developer.atlassian.com/)
- [OAuth Setup Guide](OAUTH_SETUP_GUIDE.md)

---

*Made with ❤️ for the MCP community*
