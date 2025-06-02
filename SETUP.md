# Simple Setup Guide

This guide shows you how to set up the MCP Atlassian server using **command-line OAuth** - no VS Code extension required!

## ⚡ 5-Minute Setup

### 1. Install the Server

```bash
git clone https://github.com/your-username/mcp-nodejs-atlassian.git
cd mcp-nodejs-atlassian
npm install
npm run build
```

### 2. Create an Atlassian OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **"Create"** → **"OAuth 2.0 integration"**
3. Name it something like "MCP Integration"
4. Set **Callback URL**: `http://localhost:8080/callback`
5. Add these **Scopes**:
   - `read:jira-work`
   - `write:jira-work`
   - `read:confluence-content.all`
   - `write:confluence-content`
   - `offline_access`
6. Copy your **Client ID** and **Client Secret**

### 3. Run OAuth Setup

```bash
npm run oauth-setup
```

The wizard will:
- Ask for your Client ID and Client Secret
- Open your browser for authorization
- Auto-detect your Cloud ID
- Generate all config automatically
- Show you what to add to your `.env` file

### 4. Start the Server

```bash
npm start
```

Done! Your MCP server is running and ready for AI assistants.

## 🤖 Connect to AI Assistants

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

*Note: Environment variables are loaded from your `.env` file automatically*

### Cursor IDE

1. Settings → MCP → Add global MCP server
2. **Command**: `node`
3. **Args**: `["/absolute/path/to/dist/index.js"]`

## 🔧 Alternative: Manual Token Setup

If you prefer API tokens instead of OAuth:

```bash
# Copy example config
cp env.example .env

# Edit .env with your API tokens
# Get tokens from: https://id.atlassian.com/manage-profile/security/api-tokens
```

## 🚀 Usage

Once connected, ask your AI assistant:

- "Search Confluence for API documentation"
- "Get details of Jira issue PROJ-123"
- "Create a new bug report in project MOBILE"
- "Find all my open Jira tickets"
- "Update PROJ-456 status to In Progress"

## 🛠️ Advanced Options

```bash
# Read-only mode (safe for production)
npm start -- --read-only

# Enable specific tools only
npm start -- --enabled-tools "confluence_search,jira_get_issue"

# HTTP server for web integrations
npm start -- --transport sse --port 8000

# Verbose logging
npm start -- --verbose
```

## 🆘 Troubleshooting

**OAuth Setup Issues:**
- Make sure port 8080 is available
- Check callback URL exactly matches your OAuth app
- Verify all required scopes are enabled

**Connection Issues:**
- Run `npm start -- --verbose` for detailed logs
- Test your tokens manually with curl:
```bash
curl -u username:token https://your-company.atlassian.net/rest/api/2/myself
```

**Permission Issues:**
- Ensure your user has access to the spaces/projects you're trying to access
- For Cloud: Check API token permissions
- For Server: Verify Personal Access Token scopes

---

That's it! No VS Code extension needed - just a simple command-line setup with OAuth. 