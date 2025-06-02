# Simple Setup Guide

Set up the MCP Atlassian server with command-line OAuth in 5 minutes.

## ⚡ Quick Setup

### 1. Install

```bash
git clone https://github.com/your-username/mcp-nodejs-atlassian.git
cd mcp-nodejs-atlassian
npm install && npm run build
```

### 2. Create Atlassian OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **"Create"** → **"OAuth 2.0 integration"**
3. Name it "MCP Integration"
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

### 4. Start Server

```bash
npm start
```

Done! Your MCP server is running.

## 🤖 Connect AI Assistants

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["mcp-atlassian-nodejs"]
    }
  }
}
```

**For cleaner setup (optional):**
```bash
npm install -g ./
```
Then use:
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "mcp-atlassian"
    }
  }
}
```

### Cursor

1. Settings → MCP → Add global MCP server
2. **Command**: `npx`
3. **Args**: `["mcp-atlassian-nodejs"]`

**Alternative (after global install):**
- **Command**: `mcp-atlassian`
- **Args**: `[]`

## 🔧 Alternative: API Tokens

If you prefer API tokens:

```bash
cp env.example .env
# Edit .env with your API tokens from:
# https://id.atlassian.com/manage-profile/security/api-tokens
```

## 🚀 Usage

Ask your AI assistant:

- "Search Confluence for API documentation"
- "Get details of Jira issue PROJ-123"
- "Create a bug report in project MOBILE"
- "Find all my open tickets"
- "Update PROJ-456 status to In Progress"

## 🛠️ Advanced Options

```bash
npm start -- --read-only                      # Safe mode
npm start -- --enabled-tools "search"         # Limit tools
npm start -- --transport sse --port 8000      # HTTP mode
npm start -- --verbose                        # Debug logging
```

## 🆘 Troubleshooting

**OAuth Issues:**
- Ensure port 8080 is available
- Check callback URL matches exactly
- Verify all required scopes are enabled

**Connection Issues:**
- Run `npm start -- --verbose` for logs
- Test tokens with curl:
```bash
curl -u username:token https://your-company.atlassian.net/rest/api/2/myself
```

**Permission Issues:**
- Check user access to spaces/projects
- Verify token permissions in Atlassian

---

Simple command-line setup - no extensions needed! 