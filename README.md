# MCP Atlassian Server

A simple, command-line Model Context Protocol (MCP) server for Atlassian Jira and Confluence. Connect any MCP-compatible AI assistant to your Atlassian instance with OAuth 2.0 authentication.

## 🚀 Quick Start

```bash
# 1. Install
git clone https://github.com/your-username/mcp-nodejs-atlassian.git
cd mcp-nodejs-atlassian
npm install && npm run build

# 2. Set up OAuth (interactive wizard)
npm run oauth-setup

# 3. Start the server
npm start
```

Your MCP server is now running and ready to connect to AI assistants!

## 🔧 Authentication

### OAuth 2.0 (Recommended)

Run the interactive OAuth setup wizard:

```bash
npm run oauth-setup
```

**What it does:**
- Walks you through creating an Atlassian OAuth app
- Opens your browser for secure authorization  
- Auto-detects your Cloud ID
- Generates all configuration automatically

**Requirements:**
- Atlassian Cloud account
- Port 8080 available for callback

### Manual Setup (Alternative)

For API tokens or server deployments:

```bash
cp env.example .env
# Edit .env with your credentials
```

**Atlassian Cloud:**
```bash
CONFLUENCE_URL=https://your-company.atlassian.net/wiki
CONFLUENCE_USERNAME=your.email@company.com
CONFLUENCE_API_TOKEN=your_api_token
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your.email@company.com
JIRA_API_TOKEN=your_api_token
```

**Server/Data Center:**
```bash
CONFLUENCE_URL=https://confluence.your-company.com
CONFLUENCE_PERSONAL_TOKEN=your_personal_token
JIRA_URL=https://jira.your-company.com
JIRA_PERSONAL_TOKEN=your_personal_token
```

## 🤖 AI Assistant Integration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-nodejs-atlassian/dist/index.js"]
    }
  }
}
```

### Cursor

1. Settings → MCP → Add global MCP server
2. **Command:** `node`
3. **Args:** `["/absolute/path/to/mcp-nodejs-atlassian/dist/index.js"]`

### Any MCP Client

The server supports standard MCP transports:

```bash
# stdio (default - for most AI assistants)
npm start

# HTTP Server-Sent Events
npm start -- --transport sse --port 8000

# HTTP Streamable
npm start -- --transport streamable-http --port 8000
```

## 🔧 Configuration

### Command-Line Options

```bash
node dist/index.js --help                    # Show all options
node dist/index.js --oauth-setup             # OAuth wizard
node dist/index.js --read-only               # Safe mode
node dist/index.js --verbose                 # Debug logging
node dist/index.js --enabled-tools "search"  # Limit tools
node dist/index.js --transport sse --port 8000  # HTTP mode
```

### Environment Variables

```bash
# Security
READ_ONLY_MODE=true              # Disable write operations
MCP_VERBOSE=true                 # Enable debug logging

# Filtering  
CONFLUENCE_SPACES_FILTER=DEV,TEAM,DOC     # Limit Confluence spaces
JIRA_PROJECTS_FILTER=PROJ,DEV,SUPPORT     # Limit Jira projects

# Tools
ENABLED_TOOLS=confluence_search,jira_get_issue  # Specific tools only
```

## 📚 Available Tools

### Confluence
- **confluence_search** - Search content across spaces
- **confluence_get_page** - Get specific pages by ID/title
- **confluence_create_page** - Create new pages
- **confluence_update_page** - Update existing pages

### Jira
- **jira_search_issues** - Search issues with JQL
- **jira_get_issue** - Get detailed issue info
- **jira_create_issue** - Create new issues
- **jira_update_issue** - Update existing issues

## 💬 Usage Examples

Ask your AI assistant:

- *"Search Confluence for API documentation"*
- *"Get details of Jira issue PROJ-123"*
- *"Create a bug report in the MOBILE project"*
- *"Find all my open tickets from last sprint"*
- *"Update PROJ-456 status to In Progress"*

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
docker build -t mcp-atlassian .
docker run -p 8000:8000 \
  -e CONFLUENCE_URL="https://company.atlassian.net/wiki" \
  -e CONFLUENCE_API_TOKEN="your_token" \
  -e JIRA_URL="https://company.atlassian.net" \
  -e JIRA_API_TOKEN="your_token" \
  mcp-atlassian
```

## 🏢 Enterprise Features

- ✅ **OAuth 2.0** - Secure delegated access
- ✅ **API Tokens** - Simple authentication
- ✅ **Personal Access Tokens** - Server/Data Center support
- ✅ **Read-only mode** - Safe operations
- ✅ **Access filtering** - Limit spaces/projects
- ✅ **Multiple transports** - stdio, SSE, HTTP
- ✅ **Docker ready** - Container deployment

## 🛠️ Development

```bash
npm run dev        # Development mode with hot reload
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Code linting
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Atlassian Developer Docs](https://developer.atlassian.com/)

---

*Simple, powerful Atlassian integration for AI assistants*
