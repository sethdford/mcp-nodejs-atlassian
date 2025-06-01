# VS Code Extension Creation Guide

This guide walks through creating a VS Code extension for the MCP Atlassian server.

## Step-by-Step Extension Creation

### 1. Initialize Extension Project

```bash
# Create new directory for extension
mkdir atlassian-mcp-extension
cd atlassian-mcp-extension

# Install VS Code extension generator
npm install -g yo generator-code

# Generate extension
yo code
```

### 2. Project Structure

```
atlassian-mcp-extension/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts
│   ├── mcpServer.ts
│   ├── atlassianProvider.ts
│   ├── treeProvider.ts
│   └── webview/
│       └── configuration.html
├── media/
│   ├── atlassian-icon.png
│   └── jira-icon.svg
├── server/                    # Copy your MCP server here
│   ├── dist/
│   └── package.json
└── README.md
```

### 3. Additional Extension Files

**src/atlassianProvider.ts**:
```typescript
import axios from 'axios';

export interface AtlassianConfig {
    jiraUrl?: string;
    confluenceUrl?: string;
    authMethod: 'oauth' | 'token' | 'pat';
    username?: string;
    apiToken?: string;
    oauthToken?: string;
}

export class AtlassianProvider {
    async testConnection(config: AtlassianConfig): Promise<boolean> {
        try {
            if (config.jiraUrl) {
                const response = await this.makeRequest(config, `${config.jiraUrl}/rest/api/2/myself`);
                if (!response.ok) return false;
            }
            
            if (config.confluenceUrl) {
                const response = await this.makeRequest(config, `${config.confluenceUrl}/rest/api/user/current`);
                if (!response.ok) return false;
            }
            
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    async getJiraProjects(config: AtlassianConfig): Promise<any[]> {
        try {
            const response = await this.makeRequest(config, `${config.jiraUrl}/rest/api/2/project`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch Jira projects:', error);
            return [];
        }
    }

    async getConfluenceSpaces(config: AtlassianConfig): Promise<any[]> {
        try {
            const response = await this.makeRequest(config, `${config.confluenceUrl}/rest/api/space`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Failed to fetch Confluence spaces:', error);
            return [];
        }
    }

    private async makeRequest(config: AtlassianConfig, url: string): Promise<Response> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (config.authMethod === 'token' && config.username && config.apiToken) {
            const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        } else if (config.authMethod === 'oauth' && config.oauthToken) {
            headers['Authorization'] = `Bearer ${config.oauthToken}`;
        } else if (config.authMethod === 'pat' && config.apiToken) {
            headers['Authorization'] = `Bearer ${config.apiToken}`;
        }

        return fetch(url, { headers });
    }
}
```

**src/treeProvider.ts**:
```typescript
import * as vscode from 'vscode';
import { AtlassianProvider, AtlassianConfig } from './atlassianProvider';

export class AtlassianTreeProvider implements vscode.TreeDataProvider<AtlassianItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AtlassianItem | undefined | null | void> = new vscode.EventEmitter<AtlassianItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AtlassianItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private atlassianProvider: AtlassianProvider) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AtlassianItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AtlassianItem): Promise<AtlassianItem[]> {
        const config = this.getConfiguration();
        
        if (!element) {
            // Root level
            const items: AtlassianItem[] = [];
            
            if (config.jiraUrl) {
                items.push(new AtlassianItem('Jira Projects', 'jira-root', vscode.TreeItemCollapsibleState.Collapsed));
            }
            
            if (config.confluenceUrl) {
                items.push(new AtlassianItem('Confluence Spaces', 'confluence-root', vscode.TreeItemCollapsibleState.Collapsed));
            }
            
            return items;
        }

        if (element.contextValue === 'jira-root') {
            const projects = await this.atlassianProvider.getJiraProjects(config);
            return projects.map(project => new AtlassianItem(
                `${project.key}: ${project.name}`,
                'jira-project',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'atlassianMcp.openJiraProject',
                    title: 'Open Project',
                    arguments: [project]
                }
            ));
        }

        if (element.contextValue === 'confluence-root') {
            const spaces = await this.atlassianProvider.getConfluenceSpaces(config);
            return spaces.map(space => new AtlassianItem(
                `${space.key}: ${space.name}`,
                'confluence-space',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'atlassianMcp.openConfluenceSpace',
                    title: 'Open Space',
                    arguments: [space]
                }
            ));
        }

        return [];
    }

    private getConfiguration(): AtlassianConfig {
        const config = vscode.workspace.getConfiguration('atlassianMcp');
        return {
            jiraUrl: config.get('jiraUrl'),
            confluenceUrl: config.get('confluenceUrl'),
            authMethod: config.get('authMethod') || 'oauth',
            username: config.get('username'),
            apiToken: config.get('apiToken')
        };
    }
}

class AtlassianItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
    }
}
```

### 4. Bundle MCP Server with Extension

**Copy server files:**
```bash
# Copy your built MCP server
cp -r ../mcp-nodejs-atlassian/dist ./server/
cp ../mcp-nodejs-atlassian/package.json ./server/
```

**Update package.json to include server:**
```json
{
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      {
        "command": "atlassianMcp.configure",
        "title": "Configure Atlassian MCP",
        "category": "Atlassian",
        "icon": "$(gear)"
      },
      {
        "command": "atlassianMcp.searchJira",
        "title": "Search Jira Issues",
        "category": "Atlassian",
        "icon": "$(search)"
      },
      {
        "command": "atlassianMcp.searchConfluence",
        "title": "Search Confluence",
        "category": "Atlassian",
        "icon": "$(book)"
      }
    ],
    "menus": {
      "view/title": [
        {
          "command": "atlassianMcp.configure",
          "when": "view == atlassianMcp",
          "group": "navigation"
        }
      ],
      "commandPalette": [
        {
          "command": "atlassianMcp.configure"
        },
        {
          "command": "atlassianMcp.searchJira"
        },
        {
          "command": "atlassianMcp.searchConfluence"
        }
      ]
    }
  }
}
```

### 5. Testing and Debugging

**Create test workspace:**
```bash
mkdir test-workspace
cd test-workspace
code .
```

**Test extension:**
1. Open extension project in VS Code
2. Press F5 to launch Extension Development Host
3. Test all commands and functionality
4. Check output channel for logs

### 6. Publishing Preparation

**Create publisher account:**
1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. Sign in with Microsoft account
3. Create publisher profile

**Package extension:**
```bash
# Install packaging tool
npm install -g @vscode/vsce

# Package extension
vsce package

# This creates .vsix file
```

**Test packaged extension:**
```bash
# Install locally
code --install-extension atlassian-mcp-server-1.0.0.vsix
```

### 7. Marketplace Publishing

**Publish to marketplace:**
```bash
# Login to publisher account
vsce login your-publisher-name

# Publish extension
vsce publish

# Or publish specific version
vsce publish 1.0.1

# Publish pre-release
vsce publish --pre-release
```

**Update extension:**
```bash
# Increment version in package.json
npm version patch

# Publish update
vsce publish
```

### 8. Extension Features Roadmap

**Phase 1 (MVP):**
- [x] MCP server management
- [x] Configuration UI
- [x] Tree view for projects/spaces
- [x] Status bar integration

**Phase 2 (Enhanced):**
- [ ] Issue search and creation
- [ ] Page editing interface
- [ ] Code commenting with issue links
- [ ] Smart suggestions

**Phase 3 (Advanced):**
- [ ] GitHub Copilot integration
- [ ] Automated issue creation from TODOs
- [ ] Time tracking integration
- [ ] Custom dashboards

### 9. Marketing Strategy

**Keywords for visibility:**
- atlassian, jira, confluence, mcp, ai, productivity, project-management, developer-tools

**Screenshots to include:**
1. Configuration wizard
2. Tree view with projects/spaces
3. Search functionality
4. Integration with AI tools

**Extension description:**
"Seamlessly connect VS Code to your Atlassian workspace (Jira & Confluence) using the Model Context Protocol. Enable AI assistants to access your project data for smarter code suggestions and automated workflows."

### 10. Maintenance and Updates

**Automated testing:**
```bash
# Add to package.json scripts
"test": "node ./out/test/runTest.js",
"test:extension": "vscode-test"
```

**CI/CD Pipeline:**
```yaml
# .github/workflows/release.yml
name: Release Extension
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run compile
      - run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

This extension would significantly increase the accessibility and adoption of your MCP Atlassian server! 