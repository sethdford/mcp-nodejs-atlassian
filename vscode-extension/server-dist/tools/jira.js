export function createJiraTools(client) {
    return [
        {
            name: 'jira_search_issues',
            description: 'Search for issues in Jira using JQL (Jira Query Language)',
            inputSchema: {
                type: 'object',
                properties: {
                    jql: {
                        type: 'string',
                        description: 'JQL query to search for issues'
                    },
                    fields: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of fields to include in the response'
                    },
                    maxResults: {
                        type: 'number',
                        description: 'Maximum number of results to return (default: 50)',
                        default: 50
                    }
                },
                required: ['jql']
            }
        },
        {
            name: 'jira_get_issue',
            description: 'Get a specific Jira issue by key',
            inputSchema: {
                type: 'object',
                properties: {
                    issueKey: {
                        type: 'string',
                        description: 'The key of the issue to retrieve (e.g., PROJ-123)'
                    },
                    fields: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of fields to include in the response'
                    },
                    expand: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of properties to expand (e.g., changelog, comments)'
                    }
                },
                required: ['issueKey']
            }
        },
        {
            name: 'jira_create_issue',
            description: 'Create a new issue in Jira',
            inputSchema: {
                type: 'object',
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'The key of the project to create the issue in'
                    },
                    issueType: {
                        type: 'string',
                        description: 'The type of issue to create (e.g., Bug, Task, Story)'
                    },
                    summary: {
                        type: 'string',
                        description: 'The summary/title of the issue'
                    },
                    description: {
                        type: 'string',
                        description: 'The description of the issue'
                    },
                    priority: {
                        type: 'string',
                        description: 'The priority of the issue (e.g., High, Medium, Low)'
                    }
                },
                required: ['projectKey', 'issueType', 'summary']
            }
        },
        {
            name: 'jira_update_issue',
            description: 'Update an existing Jira issue',
            inputSchema: {
                type: 'object',
                properties: {
                    issueKey: {
                        type: 'string',
                        description: 'The key of the issue to update'
                    },
                    fields: {
                        type: 'object',
                        description: 'Object containing the fields to update'
                    }
                },
                required: ['issueKey', 'fields']
            }
        },
        {
            name: 'jira_add_comment',
            description: 'Add a comment to a Jira issue',
            inputSchema: {
                type: 'object',
                properties: {
                    issueKey: {
                        type: 'string',
                        description: 'The key of the issue to comment on'
                    },
                    body: {
                        type: 'string',
                        description: 'The content of the comment'
                    }
                },
                required: ['issueKey', 'body']
            }
        },
        {
            name: 'jira_get_projects',
            description: 'Get a list of projects in Jira',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        }
    ];
}
//# sourceMappingURL=jira.js.map