import * as vscode from 'vscode';
import axios, { AxiosResponse } from 'axios';

export interface AtlassianConfig {
    jiraUrl?: string;
    confluenceUrl?: string;
    authMethod: 'oauth' | 'token' | 'pat';
    username?: string;
    apiToken?: string;
    oauthToken?: string;
}

export class AtlassianProvider {
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

    async testConnection(config?: AtlassianConfig): Promise<boolean> {
        const testConfig = config || this.getConfiguration();
        
        try {
            if (testConfig.jiraUrl) {
                const response = await this.makeRequest(testConfig, `${testConfig.jiraUrl}/rest/api/2/myself`);
                if (response.status !== 200) return false;
            }
            
            if (testConfig.confluenceUrl) {
                const response = await this.makeRequest(testConfig, `${testConfig.confluenceUrl}/rest/api/user/current`);
                if (response.status !== 200) return false;
            }
            
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    async getJiraProjects(config?: AtlassianConfig): Promise<any[]> {
        const testConfig = config || this.getConfiguration();
        
        if (!testConfig.jiraUrl) {
            return [];
        }

        try {
            const response = await this.makeRequest(testConfig, `${testConfig.jiraUrl}/rest/api/2/project`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch Jira projects:', error);
            return [];
        }
    }

    async getConfluenceSpaces(config?: AtlassianConfig): Promise<any[]> {
        const testConfig = config || this.getConfiguration();
        
        if (!testConfig.confluenceUrl) {
            return [];
        }

        try {
            const response = await this.makeRequest(testConfig, `${testConfig.confluenceUrl}/rest/api/space`);
            return response.data.results || [];
        } catch (error) {
            console.error('Failed to fetch Confluence spaces:', error);
            return [];
        }
    }

    async searchJiraIssues(jql: string, config?: AtlassianConfig): Promise<any[]> {
        const testConfig = config || this.getConfiguration();
        
        if (!testConfig.jiraUrl) {
            return [];
        }

        try {
            const response = await this.makeRequest(
                testConfig, 
                `${testConfig.jiraUrl}/rest/api/2/search`,
                'POST',
                { jql, maxResults: 50 }
            );
            return response.data.issues || [];
        } catch (error) {
            console.error('Failed to search Jira issues:', error);
            return [];
        }
    }

    async searchConfluence(cql: string, config?: AtlassianConfig): Promise<any[]> {
        const testConfig = config || this.getConfiguration();
        
        if (!testConfig.confluenceUrl) {
            return [];
        }

        try {
            const response = await this.makeRequest(
                testConfig,
                `${testConfig.confluenceUrl}/rest/api/content/search`,
                'GET',
                undefined,
                { cql, limit: 50 }
            );
            return response.data.results || [];
        } catch (error) {
            console.error('Failed to search Confluence:', error);
            return [];
        }
    }

    private async makeRequest(
        config: AtlassianConfig, 
        url: string, 
        method: 'GET' | 'POST' = 'GET',
        data?: any,
        params?: any
    ): Promise<AxiosResponse> {
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

        return axios({
            method,
            url,
            headers,
            data,
            params,
            timeout: 10000
        });
    }
} 