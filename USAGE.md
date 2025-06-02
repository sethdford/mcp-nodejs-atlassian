# MCP Atlassian - Complete Usage Guide

## Quick Start

### 1. Installation

```bash
# Run the installation script
chmod +x install.sh && ./install.sh

# Or manually:
npm install && npm run build
```

### 2. Configuration

**Option A: OAuth 2.0 Setup (Recommended for Cloud)**
```bash
npm start -- --oauth-setup
```

**Option B: Manual Configuration**
```bash
cp env.example .env
# Edit .env with your credentials
```

### 3. Running the Server

```bash
# Default stdio transport (for IDE integration)
npm start

# HTTP transports for web integration
npm start -- --transport sse --port 8000
npm start -- --transport streamable-http --port 8000

# With advanced options
npm start -- --verbose --read-only --enabled-tools "confluence_search,jira_get_issue"

# Show all options
npm start -- --help
```

## Authentication Methods

### OAuth 2.0 (Recommended for Atlassian Cloud)

**Step 1: Create OAuth App**
1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Create "OAuth 2.0 (3LO) integration"
3. Set scopes: `read:jira-work write:jira-work read:confluence-content.all write:confluence-content offline_access`
4. Set callback URL: `http://localhost:8080/callback`

**Step 2: Run Interactive Setup**
```bash
npm start -- --oauth-setup
```

The wizard will:
- Guide you through OAuth configuration
- Start a local callback server
- Open your browser for authorization
- Auto-detect your Atlassian Cloud ID
- Generate complete `.env` configuration

### API Token (Atlassian Cloud)

```bash
# Get from https://id.atlassian.com/manage-profile/security/api-tokens
CONFLUENCE_URL=https://your-company.atlassian.net/wiki
CONFLUENCE_USERNAME=your.email@company.com
CONFLUENCE_API_TOKEN=your_confluence_api_token
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your.email@company.com
JIRA_API_TOKEN=your_jira_api_token
```

### Personal Access Token (Server/Data Center)

```bash
CONFLUENCE_URL=https://confluence.your-company.com
CONFLUENCE_PERSONAL_TOKEN=your_confluence_pat
JIRA_URL=https://jira.your-company.com
JIRA_PERSONAL_TOKEN=your_jira_pat
```

## Transport Protocols

### stdio (Default - IDE Integration)

Perfect for Claude Desktop, Cursor, and other MCP-compatible IDEs:
```bash
npm start
```

### Server-Sent Events (SSE)

For real-time web applications:
```bash
npm start -- --transport sse --port 8000 --host 0.0.0.0

# Access at: http://localhost:8000/sse
```

Features:
- Real-time event streaming
- CORS enabled
- Keep-alive functionality
- Health monitoring

### Streamable HTTP

For general HTTP-based integrations:
```bash
npm start -- --transport streamable-http --port 8000 --path /mcp

# Access at: http://localhost:8000/mcp
# Health check: http://localhost:8000/
```

Features:
- REST-like API interface
- CORS enabled
- Health check endpoint
- JSON request/response

## IDE Integration

### Claude Desktop

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "mcp-atlassian": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-atlassian/dist/index.js"],
      "env": {
        "CONFLUENCE_URL": "https://your-company.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "your.email@company.com",
        "CONFLUENCE_API_TOKEN": "your_confluence_api_token",
        "JIRA_URL": "https://your-company.atlassian.net",
        "JIRA_USERNAME": "your.email@company.com",
        "JIRA_API_TOKEN": "your_jira_api_token"
      }
    }
  }
}
```

### Cursor

1. Open Settings → MCP
2. Add new global MCP server
3. Command: `node`
4. Args: `["/absolute/path/to/mcp-atlassian/dist/index.js"]`
5. Add environment variables as shown above

### HTTP Transport Integration

For web applications using SSE:
```json
{
  "mcpServers": {
    "mcp-atlassian-http": {
      "url": "http://localhost:8000/sse"
    }
  }
}
```

For HTTP API integration:
```json
{
  "mcpServers": {
    "mcp-atlassian-api": {
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

## Available Tools

### Confluence Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `confluence_search` | Search content using CQL | `query`, `spaceKey?`, `limit?` |
| `confluence_get_page` | Get page by ID | `pageId`, `expand?` |
| `confluence_create_page` | Create new page | `spaceKey`, `title`, `content`, `parentId?` |
| `confluence_update_page` | Update existing page | `pageId`, `title`, `content`, `version` |
| `confluence_get_spaces` | List spaces | `limit?`, `start?` |

### Jira Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `jira_search_issues` | Search using JQL | `jql`, `fields?`, `maxResults?` |
| `jira_get_issue` | Get issue by key | `issueKey`, `fields?`, `expand?` |
| `jira_create_issue` | Create new issue | `projectKey`, `issueType`, `summary`, `description?`, `priority?` |
| `jira_update_issue` | Update existing issue | `issueKey`, `fields` |
| `jira_add_comment` | Add comment to issue | `issueKey`, `body` |
| `jira_get_projects` | List projects | - |

## Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CONFLUENCE_URL` | Confluence base URL (include `/wiki` for Cloud) | - | Yes* |
| `CONFLUENCE_USERNAME` | Username for Cloud API token auth | - | Cloud |
| `CONFLUENCE_API_TOKEN` | API token for Cloud | - | Cloud |
| `CONFLUENCE_PERSONAL_TOKEN` | Personal token for Server/DC | - | Server/DC |
| `CONFLUENCE_SPACES_FILTER` | Comma-separated space keys | All | No |
| `JIRA_URL` | Jira base URL | - | Yes* |
| `JIRA_USERNAME` | Username for Cloud API token auth | - | Cloud |
| `JIRA_API_TOKEN` | API token for Cloud | - | Cloud |
| `JIRA_PERSONAL_TOKEN` | Personal token for Server/DC | - | Server/DC |
| `JIRA_PROJECTS_FILTER` | Comma-separated project keys | All | No |
| `READ_ONLY_MODE` | Disable write operations | `false` | No |
| `MCP_VERBOSE` | Enable verbose logging | `false` | No |
| `ENABLED_TOOLS` | Comma-separated tool names | All | No |
| `TRANSPORT` | Transport type | `stdio` | No |
| `PORT` | Port for HTTP transports | `8000` | No |
| `HOST` | Host for HTTP transports | `0.0.0.0` | No |

*Either Confluence or Jira URL required, not both

### Command Line Options

```bash
# Authentication
--confluence-url <url>              # Confluence base URL
--confluence-username <username>    # Cloud username
--confluence-token <token>          # Cloud API token
--confluence-personal-token <token> # Server/DC personal token
--jira-url <url>                    # Jira base URL
--jira-username <username>          # Cloud username
--jira-token <token>                # Cloud API token
--jira-personal-token <token>       # Server/DC personal token

# Transport
--transport <type>                  # stdio|sse|streamable-http
--port <number>                     # Port for HTTP transports
--host <host>                       # Host for HTTP transports
--path <path>                       # Path for HTTP transports

# Configuration
--env-file <path>                   # Path to .env file
--read-only                         # Enable read-only mode
--enabled-tools <tools>             # Comma-separated tool list
--confluence-spaces-filter <spaces> # Space filter
--jira-projects-filter <projects>   # Project filter

# Setup and debugging
--oauth-setup                       # Run OAuth setup wizard
--verbose                           # Enable verbose logging
--help                              # Show help
```

## Usage Examples

### Basic Search Operations

```bash
# Search Confluence
confluence_search(query="API documentation", spaceKey="DEV", limit=10)

# Search Jira issues
jira_search_issues(jql="project = PROJ AND status = Open", maxResults=20)
```

### Content Management

```bash
# Create Confluence page
confluence_create_page(
    spaceKey="DEV",
    title="New API Guide",
    content="<h1>API Guide</h1><p>Content here...</p>"
)

# Create Jira issue
jira_create_issue(
    projectKey="PROJ",
    issueType="Task",
    summary="Implement new feature",
    description="Detailed description here...",
    priority="High"
)
```

### Advanced Filtering

```bash
# Environment-based filtering
CONFLUENCE_SPACES_FILTER=DEV,DOC,TEAM
JIRA_PROJECTS_FILTER=PROJ,DEV,SUPPORT

# Runtime tool filtering
npm start -- --enabled-tools "confluence_search,jira_search_issues"
```

## Troubleshooting

### Common Issues

**1. Build/Module Errors**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**2. Authentication Issues**
```bash
# Test Confluence access
curl -u username:token https://your-company.atlassian.net/wiki/rest/api/content

# Test Jira access
curl -u username:token https://your-company.atlassian.net/rest/api/2/myself
```

**3. OAuth Setup Issues**
- Verify callback URL matches OAuth app exactly
- Check all required scopes are configured
- Ensure Cloud ID is correct

**4. Permission Errors**
- Verify API token has required permissions
- Check space/project accessibility
- For Server/DC, verify PAT scopes

**5. Transport Issues**
```bash
# Check port availability
lsof -i :8000

# Test HTTP endpoints
curl http://localhost:8000/  # Health check
```

### Debug Mode

```bash
# Enable verbose logging
npm start -- --verbose

# Or via environment
MCP_VERBOSE=true npm start

# Check available tools
npm start -- --enabled-tools ""
```

### Performance Optimization

```bash
# Limit scope for better performance
CONFLUENCE_SPACES_FILTER=IMPORTANT,CRITICAL
JIRA_PROJECTS_FILTER=MAIN,URGENT
ENABLED_TOOLS=confluence_search,jira_search_issues
READ_ONLY_MODE=true  # For safety
```

## Development

### Development Mode
```bash
npm run dev    # Auto-reload with tsx
```

### Testing
```bash
npm test       # Run tests
npm run lint   # Check code style
```

### Custom Configuration
```bash
# Custom environment file
npm start -- --env-file .env.production

# Override specific settings
npm start -- --port 9000 --verbose --read-only
```

## Production Deployment

### Process Management
```bash
# Using PM2
pm2 start dist/index.js --name mcp-atlassian -- --transport sse --port 8000

# Using systemd (see README-nodejs.md for full service file)
sudo systemctl start mcp-atlassian
```

### Security Best Practices
- Use HTTPS for production HTTP transports
- Rotate API tokens regularly
- Use read-only mode when possible
- Configure proper firewall rules
- Store credentials securely (not in version control)

## Enterprise Deployment

### Production Setup

1. **Server Installation**:
```bash
git clone https://github.com/your-username/mcp-nodejs-atlassian.git
cd mcp-nodejs-atlassian
npm ci --only=production
npm run build
```

2. **Environment Configuration**:
```bash
cp env.example .env
# Configure production credentials
```

3. **Process Management**:
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name mcp-atlassian -- --transport sse --port 8000

# Using systemd
sudo systemctl start mcp-atlassian
```

4. **Monitoring & Health Checks**:
```bash
# PM2 monitoring
pm2 monit

# Health endpoint
curl http://localhost:8000/health
``` 