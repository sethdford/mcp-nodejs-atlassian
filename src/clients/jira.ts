import axios, { AxiosInstance } from 'axios';
import { Logger } from '../utils/logger.js';

export class JiraClient {
  private client: AxiosInstance;
  private logger: Logger;
  private baseUrl: string;

  constructor() {
    this.logger = new Logger('jira-client');
    this.baseUrl = process.env.JIRA_URL || '';
    
    if (!this.baseUrl) {
      throw new Error('JIRA_URL environment variable is required');
    }

    // Setup authentication
    let auth: any = {};
    if (process.env.JIRA_PERSONAL_TOKEN) {
      // Personal Access Token for Server/Data Center
      auth.headers = {
        'Authorization': `Bearer ${process.env.JIRA_PERSONAL_TOKEN}`
      };
    } else if (process.env.JIRA_USERNAME && process.env.JIRA_API_TOKEN) {
      // Username + API Token for Cloud
      auth.auth = {
        username: process.env.JIRA_USERNAME,
        password: process.env.JIRA_API_TOKEN
      };
    } else {
      throw new Error('Jira authentication credentials not found. Set either JIRA_PERSONAL_TOKEN or JIRA_USERNAME + JIRA_API_TOKEN');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      ...auth
    });

    this.logger.info(`Jira client initialized for ${this.baseUrl}`);
  }

  async searchIssues(jql: string, fields?: string[], maxResults: number = 50): Promise<any> {
    try {
      const params: any = {
        jql,
        maxResults
      };

      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      }

      // Apply project filter if configured
      const projectsFilter = process.env.JIRA_PROJECTS_FILTER;
      if (projectsFilter) {
        const projects = projectsFilter.split(',').map(p => p.trim()).join(',');
        params.jql = `project in (${projects}) AND (${jql})`;
      }

      const response = await this.client.get('/rest/api/2/search', { params });
      
      this.logger.debug(`Search completed: ${response.data.issues?.length || 0} issues found`);
      return response.data;
    } catch (error) {
      this.logger.error('Issue search failed:', error);
      throw error;
    }
  }

  async getIssue(issueKey: string, fields?: string[], expand?: string[]): Promise<any> {
    try {
      const params: any = {};
      
      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      }
      
      if (expand && expand.length > 0) {
        params.expand = expand.join(',');
      }

      const response = await this.client.get(`/rest/api/2/issue/${issueKey}`, { params });
      
      this.logger.debug(`Retrieved issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get issue ${issueKey}:`, error);
      throw error;
    }
  }

  async createIssue(projectKey: string, issueType: string, summary: string, description?: string, priority?: string): Promise<any> {
    if (process.env.READ_ONLY_MODE === 'true') {
      throw new Error('Cannot create issue: running in read-only mode');
    }

    try {
      const issueData: any = {
        fields: {
          project: { key: projectKey },
          issuetype: { name: issueType },
          summary
        }
      };

      if (description) {
        issueData.fields.description = description;
      }

      if (priority) {
        issueData.fields.priority = { name: priority };
      }

      const response = await this.client.post('/rest/api/2/issue', issueData);
      
      this.logger.info(`Created issue: ${response.data.key}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create issue:', error);
      throw error;
    }
  }

  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<any> {
    if (process.env.READ_ONLY_MODE === 'true') {
      throw new Error('Cannot update issue: running in read-only mode');
    }

    try {
      const issueData = { fields };
      
      const response = await this.client.put(`/rest/api/2/issue/${issueKey}`, issueData);
      
      this.logger.info(`Updated issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update issue ${issueKey}:`, error);
      throw error;
    }
  }

  async addComment(issueKey: string, body: string): Promise<any> {
    if (process.env.READ_ONLY_MODE === 'true') {
      throw new Error('Cannot add comment: running in read-only mode');
    }

    try {
      const commentData = { body };
      
      const response = await this.client.post(`/rest/api/2/issue/${issueKey}/comment`, commentData);
      
      this.logger.info(`Added comment to issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to add comment to issue ${issueKey}:`, error);
      throw error;
    }
  }

  async getProjects(): Promise<any> {
    try {
      const response = await this.client.get('/rest/api/2/project');
      
      this.logger.debug(`Retrieved ${response.data?.length || 0} projects`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get projects:', error);
      throw error;
    }
  }
} 