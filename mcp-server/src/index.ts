#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: '../.env.local' });

class IlliniHuntMCPServer {
  private server: Server;
  private supabase: any;

  constructor() {
    this.server = new Server(
      {
        name: 'illinihunt-db-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'query_projects',
            description: 'Query projects from the IlliniHunt database',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter by category name',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of projects to return',
                  default: 10,
                },
                sortBy: {
                  type: 'string',
                  enum: ['recent', 'popular', 'featured'],
                  description: 'Sort order for projects',
                  default: 'recent',
                },
                search: {
                  type: 'string',
                  description: 'Search term for project name or tagline',
                },
              },
            },
          },
          {
            name: 'get_project_details',
            description: 'Get detailed information about a specific project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'UUID of the project to retrieve',
                },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'get_user_projects',
            description: 'Get all projects by a specific user',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'UUID of the user',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'get_categories',
            description: 'Get all active categories',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_project_comments',
            description: 'Get comments for a specific project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'UUID of the project',
                },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'get_platform_stats',
            description: 'Get platform statistics (total projects, users, categories)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'execute_custom_query',
            description: 'Execute a custom SQL query (read-only)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL SELECT query to execute',
                },
              },
              required: ['query'],
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'query_projects':
            return await this.queryProjects(args);
          case 'get_project_details':
            return await this.getProjectDetails(args);
          case 'get_user_projects':
            return await this.getUserProjects(args);
          case 'get_categories':
            return await this.getCategories();
          case 'get_project_comments':
            return await this.getProjectComments(args);
          case 'get_platform_stats':
            return await this.getPlatformStats();
          case 'execute_custom_query':
            return await this.executeCustomQuery(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async queryProjects(args: any) {
    try {
      let query = this.supabase
        .from('projects')
        .select(`
          *,
          users (
            id,
            username,
            full_name,
            avatar_url
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (args.category) {
        query = query.eq('categories.name', args.category);
      }

      if (args.search) {
        query = query.or(`name.ilike.%${args.search}%,tagline.ilike.%${args.search}%`);
      }

      // Apply sorting
      switch (args.sortBy) {
        case 'popular':
          query = query.order('upvotes_count', { ascending: false });
          break;
        case 'featured':
          query = query.eq('status', 'featured').order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply limit
      const limit = args.limit || 10;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async getProjectDetails(args: any) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          users (
            id,
            username,
            full_name,
            avatar_url,
            bio,
            github_url,
            linkedin_url
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('id', args.projectId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return {
          content: [
            {
              type: 'text',
              text: 'Project not found',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async getUserProjects(args: any) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('user_id', args.userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async getCategories() {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async getProjectComments(args: any) {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          users (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', args.projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async getPlatformStats() {
    try {
      // Get projects count
      const { count: projectsCount, error: projectsError } = await this.supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (projectsError) {
        throw new Error(projectsError.message);
      }

      // Get unique users count
      const { data: uniqueUsers, error: usersError } = await this.supabase
        .from('projects')
        .select('user_id')
        .eq('status', 'active');

      if (usersError) {
        throw new Error(usersError.message);
      }

      const uniqueUsersCount = new Set(uniqueUsers?.map((p: any) => p.user_id)).size;

      // Get categories count
      const { count: categoriesCount, error: categoriesError } = await this.supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (categoriesError) {
        throw new Error(categoriesError.message);
      }

      const stats = {
        projects_count: projectsCount || 0,
        users_count: uniqueUsersCount || 0,
        categories_count: categoriesCount || 0,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  private async executeCustomQuery(args: any) {
    try {
      // Basic security check - only allow SELECT queries
      const query = args.query.trim().toLowerCase();
      if (!query.startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }

      // Note: Supabase doesn't support arbitrary SQL queries via the client
      // This would require using the REST API with RPC functions
      // For now, we'll return an error explaining this limitation
      throw new Error('Custom SQL queries are not supported via Supabase client. Use the specific tools instead.');
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('IlliniHunt MCP Server running on stdio');
  }
}

// Start the server
const server = new IlliniHuntMCPServer();
server.run().catch(console.error);
