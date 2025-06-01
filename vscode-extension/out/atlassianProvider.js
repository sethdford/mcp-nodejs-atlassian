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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlassianProvider = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
class AtlassianProvider {
    getConfiguration() {
        const config = vscode.workspace.getConfiguration('atlassianMcp');
        return {
            jiraUrl: config.get('jiraUrl'),
            confluenceUrl: config.get('confluenceUrl'),
            authMethod: config.get('authMethod') || 'oauth',
            username: config.get('username'),
            apiToken: config.get('apiToken')
        };
    }
    async testConnection(config) {
        const testConfig = config || this.getConfiguration();
        try {
            if (testConfig.jiraUrl) {
                const response = await this.makeRequest(testConfig, `${testConfig.jiraUrl}/rest/api/2/myself`);
                if (response.status !== 200)
                    return false;
            }
            if (testConfig.confluenceUrl) {
                const response = await this.makeRequest(testConfig, `${testConfig.confluenceUrl}/rest/api/user/current`);
                if (response.status !== 200)
                    return false;
            }
            return true;
        }
        catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    async getJiraProjects(config) {
        const testConfig = config || this.getConfiguration();
        if (!testConfig.jiraUrl) {
            return [];
        }
        try {
            const response = await this.makeRequest(testConfig, `${testConfig.jiraUrl}/rest/api/2/project`);
            return response.data;
        }
        catch (error) {
            console.error('Failed to fetch Jira projects:', error);
            return [];
        }
    }
    async getConfluenceSpaces(config) {
        const testConfig = config || this.getConfiguration();
        if (!testConfig.confluenceUrl) {
            return [];
        }
        try {
            const response = await this.makeRequest(testConfig, `${testConfig.confluenceUrl}/rest/api/space`);
            return response.data.results || [];
        }
        catch (error) {
            console.error('Failed to fetch Confluence spaces:', error);
            return [];
        }
    }
    async searchJiraIssues(jql, config) {
        const testConfig = config || this.getConfiguration();
        if (!testConfig.jiraUrl) {
            return [];
        }
        try {
            const response = await this.makeRequest(testConfig, `${testConfig.jiraUrl}/rest/api/2/search`, 'POST', { jql, maxResults: 50 });
            return response.data.issues || [];
        }
        catch (error) {
            console.error('Failed to search Jira issues:', error);
            return [];
        }
    }
    async searchConfluence(cql, config) {
        const testConfig = config || this.getConfiguration();
        if (!testConfig.confluenceUrl) {
            return [];
        }
        try {
            const response = await this.makeRequest(testConfig, `${testConfig.confluenceUrl}/rest/api/content/search`, 'GET', undefined, { cql, limit: 50 });
            return response.data.results || [];
        }
        catch (error) {
            console.error('Failed to search Confluence:', error);
            return [];
        }
    }
    async makeRequest(config, url, method = 'GET', data, params) {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        if (config.authMethod === 'token' && config.username && config.apiToken) {
            const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }
        else if (config.authMethod === 'oauth' && config.oauthToken) {
            headers['Authorization'] = `Bearer ${config.oauthToken}`;
        }
        else if (config.authMethod === 'pat' && config.apiToken) {
            headers['Authorization'] = `Bearer ${config.apiToken}`;
        }
        return (0, axios_1.default)({
            method,
            url,
            headers,
            data,
            params,
            timeout: 10000
        });
    }
}
exports.AtlassianProvider = AtlassianProvider;
//# sourceMappingURL=atlassianProvider.js.map