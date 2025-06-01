import * as vscode from 'vscode';
import { AtlassianProvider } from './atlassianProvider';

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
        if (!element) {
            // Root level
            const items: AtlassianItem[] = [];
            const config = vscode.workspace.getConfiguration('atlassianMcp');
            
            if (config.get('jiraUrl')) {
                items.push(new AtlassianItem(
                    'Jira Projects', 
                    'jira-root', 
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    'list-flat'
                ));
            }
            
            if (config.get('confluenceUrl')) {
                items.push(new AtlassianItem(
                    'Confluence Spaces', 
                    'confluence-root', 
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    'library'
                ));
            }

            if (items.length === 0) {
                items.push(new AtlassianItem(
                    'No Atlassian instances configured',
                    'no-config',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'atlassianMcp.configure',
                        title: 'Configure',
                        arguments: []
                    },
                    'warning'
                ));
            }
            
            return items;
        }

        if (element.contextValue === 'jira-root') {
            try {
                const projects = await this.atlassianProvider.getJiraProjects();
                return projects.map(project => new AtlassianItem(
                    `${project.key}: ${project.name}`,
                    'jira-project',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'atlassianMcp.openJiraProject',
                        title: 'Open Project',
                        arguments: [project]
                    },
                    'bug',
                    `${project.projectTypeKey} project`
                ));
            } catch (error) {
                return [new AtlassianItem(
                    'Failed to load projects',
                    'error',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'atlassianMcp.configure',
                        title: 'Check Configuration',
                        arguments: []
                    },
                    'error'
                )];
            }
        }

        if (element.contextValue === 'confluence-root') {
            try {
                const spaces = await this.atlassianProvider.getConfluenceSpaces();
                return spaces.map(space => new AtlassianItem(
                    `${space.key}: ${space.name}`,
                    'confluence-space',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'atlassianMcp.openConfluenceSpace',
                        title: 'Open Space',
                        arguments: [space]
                    },
                    'book',
                    space.type
                ));
            } catch (error) {
                return [new AtlassianItem(
                    'Failed to load spaces',
                    'error',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'atlassianMcp.configure',
                        title: 'Check Configuration',
                        arguments: []
                    },
                    'error'
                )];
            }
        }

        return [];
    }
}

class AtlassianItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        iconName?: string,
        description?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = description || this.label;
        this.description = description;
        
        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
        
        // Add context menu support
        if (contextValue === 'jira-project') {
            this.contextValue = 'jira-project';
        } else if (contextValue === 'confluence-space') {
            this.contextValue = 'confluence-space';
        }
    }
} 