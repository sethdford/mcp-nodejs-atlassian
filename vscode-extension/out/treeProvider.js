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
exports.AtlassianTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
class AtlassianTreeProvider {
    constructor(atlassianProvider) {
        this.atlassianProvider = atlassianProvider;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root level
            const items = [];
            const config = vscode.workspace.getConfiguration('atlassianMcp');
            if (config.get('jiraUrl')) {
                items.push(new AtlassianItem('Jira Projects', 'jira-root', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'list-flat'));
            }
            if (config.get('confluenceUrl')) {
                items.push(new AtlassianItem('Confluence Spaces', 'confluence-root', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'library'));
            }
            if (items.length === 0) {
                items.push(new AtlassianItem('No Atlassian instances configured', 'no-config', vscode.TreeItemCollapsibleState.None, {
                    command: 'atlassianMcp.configure',
                    title: 'Configure',
                    arguments: []
                }, 'warning'));
            }
            return items;
        }
        if (element.contextValue === 'jira-root') {
            try {
                const projects = await this.atlassianProvider.getJiraProjects();
                return projects.map(project => new AtlassianItem(`${project.key}: ${project.name}`, 'jira-project', vscode.TreeItemCollapsibleState.None, {
                    command: 'atlassianMcp.openJiraProject',
                    title: 'Open Project',
                    arguments: [project]
                }, 'bug', `${project.projectTypeKey} project`));
            }
            catch (error) {
                return [new AtlassianItem('Failed to load projects', 'error', vscode.TreeItemCollapsibleState.None, {
                        command: 'atlassianMcp.configure',
                        title: 'Check Configuration',
                        arguments: []
                    }, 'error')];
            }
        }
        if (element.contextValue === 'confluence-root') {
            try {
                const spaces = await this.atlassianProvider.getConfluenceSpaces();
                return spaces.map(space => new AtlassianItem(`${space.key}: ${space.name}`, 'confluence-space', vscode.TreeItemCollapsibleState.None, {
                    command: 'atlassianMcp.openConfluenceSpace',
                    title: 'Open Space',
                    arguments: [space]
                }, 'book', space.type));
            }
            catch (error) {
                return [new AtlassianItem('Failed to load spaces', 'error', vscode.TreeItemCollapsibleState.None, {
                        command: 'atlassianMcp.configure',
                        title: 'Check Configuration',
                        arguments: []
                    }, 'error')];
            }
        }
        return [];
    }
}
exports.AtlassianTreeProvider = AtlassianTreeProvider;
class AtlassianItem extends vscode.TreeItem {
    constructor(label, contextValue, collapsibleState, command, iconName, description) {
        super(label, collapsibleState);
        this.label = label;
        this.contextValue = contextValue;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.tooltip = description || this.label;
        this.description = description;
        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
        // Add context menu support
        if (contextValue === 'jira-project') {
            this.contextValue = 'jira-project';
        }
        else if (contextValue === 'confluence-space') {
            this.contextValue = 'confluence-space';
        }
    }
}
//# sourceMappingURL=treeProvider.js.map