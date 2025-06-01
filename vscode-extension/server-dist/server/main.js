import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../utils/logger.js';
import { ConfluenceClient } from '../clients/confluence.js';
import { JiraClient } from '../clients/jira.js';
import { createConfluenceTools } from '../tools/confluence.js';
import { createJiraTools } from '../tools/jira.js';
import { SSETransport, StreamableHttpTransport } from './http-transports.js';
export function createAtlassianMCPServer() {
    const logger = new Logger('mcp-server');
    const server = new Server({
        name: 'mcp-atlassian',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    });
    // Initialize clients
    const confluenceClient = new ConfluenceClient();
    const jiraClient = new JiraClient();
    // Get all available tools
    const allTools = [
        ...createConfluenceTools(confluenceClient),
        ...createJiraTools(jiraClient)
    ];
    // Filter tools based on configuration
    const enabledToolsEnv = process.env.ENABLED_TOOLS;
    const enabledToolNames = enabledToolsEnv ? enabledToolsEnv.split(',').map(t => t.trim()) : null;
    const tools = enabledToolNames
        ? allTools.filter(tool => enabledToolNames.includes(tool.name))
        : allTools;
    logger.info(`Loaded ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
    // Handle tool listing
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });
    // Handle tool execution
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        logger.debug(`Executing tool: ${name}`, args);
        try {
            // Find the tool
            const tool = tools.find(t => t.name === name);
            if (!tool) {
                throw new Error(`Tool '${name}' not found`);
            }
            // Execute the tool based on its type
            let result;
            if (name.startsWith('confluence_')) {
                result = await executeConfluenceTool(confluenceClient, name, args);
            }
            else if (name.startsWith('jira_')) {
                result = await executeJiraTool(jiraClient, name, args);
            }
            else {
                throw new Error(`Unknown tool category for '${name}'`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            logger.error(`Error executing tool ${name}:`, error);
            throw error;
        }
    });
    return {
        ...server,
        connect: async (options) => {
            if (options.type === 'stdio') {
                const transport = new StdioServerTransport();
                await server.connect(transport);
                logger.info('MCP server connected via stdio');
            }
            else if (options.type === 'sse') {
                const transportOptions = {
                    host: options.host || '0.0.0.0',
                    port: options.port || 8000,
                    path: options.path || '/sse'
                };
                const transport = new SSETransport(transportOptions);
                await transport.start(server);
                logger.info(`MCP server started with SSE transport on http://${transportOptions.host}:${transportOptions.port}${transportOptions.path}`);
            }
            else if (options.type === 'streamable-http') {
                const transportOptions = {
                    host: options.host || '0.0.0.0',
                    port: options.port || 8000,
                    path: options.path || '/mcp'
                };
                const transport = new StreamableHttpTransport(transportOptions);
                await transport.start(server);
                logger.info(`MCP server started with Streamable HTTP transport on http://${transportOptions.host}:${transportOptions.port}${transportOptions.path}`);
            }
            else {
                throw new Error(`Unknown transport type: ${options.type}`);
            }
        }
    };
}
async function executeConfluenceTool(client, toolName, args) {
    switch (toolName) {
        case 'confluence_search':
            return await client.search(args.query, args.spaceKey, args.limit);
        case 'confluence_get_page':
            return await client.getPage(args.pageId, args.expand);
        case 'confluence_create_page':
            return await client.createPage(args.spaceKey, args.title, args.content, args.parentId);
        case 'confluence_update_page':
            return await client.updatePage(args.pageId, args.title, args.content, args.version);
        case 'confluence_get_spaces':
            return await client.getSpaces(args.limit, args.start);
        default:
            throw new Error(`Unknown Confluence tool: ${toolName}`);
    }
}
async function executeJiraTool(client, toolName, args) {
    switch (toolName) {
        case 'jira_search_issues':
            return await client.searchIssues(args.jql, args.fields, args.maxResults);
        case 'jira_get_issue':
            return await client.getIssue(args.issueKey, args.fields, args.expand);
        case 'jira_create_issue':
            return await client.createIssue(args.projectKey, args.issueType, args.summary, args.description, args.priority);
        case 'jira_update_issue':
            return await client.updateIssue(args.issueKey, args.fields);
        case 'jira_add_comment':
            return await client.addComment(args.issueKey, args.body);
        case 'jira_get_projects':
            return await client.getProjects();
        default:
            throw new Error(`Unknown Jira tool: ${toolName}`);
    }
}
//# sourceMappingURL=main.js.map