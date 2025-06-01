import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ConfluenceClient } from '../clients/confluence.js';

export function createConfluenceTools(client: ConfluenceClient): Tool[] {
  return [
    {
      name: 'confluence_search',
      description: 'Search for content in Confluence using CQL (Confluence Query Language)',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'CQL query to search for content'
          },
          spaceKey: {
            type: 'string',
            description: 'Optional space key to limit search to a specific space'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10)',
            default: 10
          }
        },
        required: ['query']
      }
    },
    {
      name: 'confluence_get_page',
      description: 'Get a specific Confluence page by ID',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: {
            type: 'string',
            description: 'The ID of the page to retrieve'
          },
          expand: {
            type: 'string',
            description: 'Comma-separated list of properties to expand (e.g., "body.storage,version")'
          }
        },
        required: ['pageId']
      }
    },
    {
      name: 'confluence_create_page',
      description: 'Create a new page in Confluence',
      inputSchema: {
        type: 'object',
        properties: {
          spaceKey: {
            type: 'string',
            description: 'The key of the space to create the page in'
          },
          title: {
            type: 'string',
            description: 'The title of the new page'
          },
          content: {
            type: 'string',
            description: 'The content of the page in Confluence storage format'
          },
          parentId: {
            type: 'string',
            description: 'Optional ID of the parent page'
          }
        },
        required: ['spaceKey', 'title', 'content']
      }
    },
    {
      name: 'confluence_update_page',
      description: 'Update an existing Confluence page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: {
            type: 'string',
            description: 'The ID of the page to update'
          },
          title: {
            type: 'string',
            description: 'The new title of the page'
          },
          content: {
            type: 'string',
            description: 'The new content of the page in Confluence storage format'
          },
          version: {
            type: 'number',
            description: 'The current version number of the page'
          }
        },
        required: ['pageId', 'title', 'content', 'version']
      }
    },
    {
      name: 'confluence_get_spaces',
      description: 'Get a list of spaces in Confluence',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of spaces to return (default: 25)',
            default: 25
          },
          start: {
            type: 'number',
            description: 'Starting index for pagination (default: 0)',
            default: 0
          }
        }
      }
    }
  ];
} 