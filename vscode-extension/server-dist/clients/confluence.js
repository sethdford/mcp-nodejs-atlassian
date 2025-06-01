import axios from 'axios';
import { Logger } from '../utils/logger.js';
export class ConfluenceClient {
    client;
    logger;
    baseUrl;
    constructor() {
        this.logger = new Logger('confluence-client');
        this.baseUrl = process.env.CONFLUENCE_URL || '';
        if (!this.baseUrl) {
            throw new Error('CONFLUENCE_URL environment variable is required');
        }
        // Setup authentication
        let auth = {};
        if (process.env.CONFLUENCE_PERSONAL_TOKEN) {
            // Personal Access Token for Server/Data Center
            auth.headers = {
                'Authorization': `Bearer ${process.env.CONFLUENCE_PERSONAL_TOKEN}`
            };
        }
        else if (process.env.CONFLUENCE_USERNAME && process.env.CONFLUENCE_API_TOKEN) {
            // Username + API Token for Cloud
            auth.auth = {
                username: process.env.CONFLUENCE_USERNAME,
                password: process.env.CONFLUENCE_API_TOKEN
            };
        }
        else {
            throw new Error('Confluence authentication credentials not found. Set either CONFLUENCE_PERSONAL_TOKEN or CONFLUENCE_USERNAME + CONFLUENCE_API_TOKEN');
        }
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            ...auth
        });
        this.logger.info(`Confluence client initialized for ${this.baseUrl}`);
    }
    async search(query, spaceKey, limit = 10) {
        try {
            const params = {
                cql: query,
                limit
            };
            if (spaceKey) {
                params.cql = `space = ${spaceKey} AND ${query}`;
            }
            // Check for spaces filter
            const spacesFilter = process.env.CONFLUENCE_SPACES_FILTER;
            if (spacesFilter && !spaceKey) {
                const spaces = spacesFilter.split(',').map(s => s.trim()).join(',');
                params.cql = `space in (${spaces}) AND ${query}`;
            }
            const response = await this.client.get('/rest/api/content/search', { params });
            this.logger.debug(`Search completed: ${response.data.results?.length || 0} results`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Search failed:', error);
            throw error;
        }
    }
    async getPage(pageId, expand) {
        try {
            const params = {};
            if (expand) {
                params.expand = expand;
            }
            const response = await this.client.get(`/rest/api/content/${pageId}`, { params });
            this.logger.debug(`Retrieved page: ${pageId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get page ${pageId}:`, error);
            throw error;
        }
    }
    async createPage(spaceKey, title, content, parentId) {
        if (process.env.READ_ONLY_MODE === 'true') {
            throw new Error('Cannot create page: running in read-only mode');
        }
        try {
            const pageData = {
                type: 'page',
                title,
                space: { key: spaceKey },
                body: {
                    storage: {
                        value: content,
                        representation: 'storage'
                    }
                }
            };
            if (parentId) {
                pageData.ancestors = [{ id: parentId }];
            }
            const response = await this.client.post('/rest/api/content', pageData);
            this.logger.info(`Created page: ${title} (${response.data.id})`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to create page ${title}:`, error);
            throw error;
        }
    }
    async updatePage(pageId, title, content, version) {
        if (process.env.READ_ONLY_MODE === 'true') {
            throw new Error('Cannot update page: running in read-only mode');
        }
        try {
            const pageData = {
                id: pageId,
                type: 'page',
                title,
                body: {
                    storage: {
                        value: content,
                        representation: 'storage'
                    }
                },
                version: {
                    number: version + 1
                }
            };
            const response = await this.client.put(`/rest/api/content/${pageId}`, pageData);
            this.logger.info(`Updated page: ${title} (${pageId})`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to update page ${pageId}:`, error);
            throw error;
        }
    }
    async getSpaces(limit = 25, start = 0) {
        try {
            const params = { limit, start };
            const response = await this.client.get('/rest/api/space', { params });
            this.logger.debug(`Retrieved ${response.data.results?.length || 0} spaces`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get spaces:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=confluence.js.map