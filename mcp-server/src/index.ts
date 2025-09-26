#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: '../.env.local' });

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class IlliniHuntMCPServer {
  private server: Server;
  private supabase: SupabaseClient;
  private rateLimiter: Map<string, RateLimitEntry>;
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

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
    this.rateLimiter = new Map();
    this.setupHandlers();
  }

  // Rate limiting method
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimiter.get(clientId);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimiter.set(clientId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }

    if (entry.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    entry.count++;
    return true;
  }

  // Input validation methods
  private validateQueryProjectsInput(args: any): void {
    if (args.limit && (typeof args.limit !== 'number' || args.limit < 1 || args.limit > 100)) {
      throw new Error('Limit must be a number between 1 and 100');
    }
    
    if (args.category && (typeof args.category !== 'string' || args.category.length > 100)) {
      throw new Error('Category must be a string with maximum 100 characters');
    }
    
    if (args.search && (typeof args.search !== 'string' || args.search.length > 200)) {
      throw new Error('Search term must be a string with maximum 200 characters');
    }
    
    if (args.sortBy && !['recent', 'popular', 'featured'].includes(args.sortBy)) {
      throw new Error('SortBy must be one of: recent, popular, featured');
    }
  }

  private validateProjectIdInput(args: any): void {
    if (!args.projectId || typeof args.projectId !== 'string') {
      throw new Error('ProjectId is required and must be a string');
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(args.projectId)) {
      throw new Error('ProjectId must be a valid UUID');
    }
  }

  private validateUserIdInput(args: any): void {
    if (!args.userId || typeof args.userId !== 'string') {
      throw new Error('UserId is required and must be a string');
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(args.userId)) {
      throw new Error('UserId must be a valid UUID');
    }
  }

  private validateCustomQueryInput(args: any): void {
    if (!args.query || typeof args.query !== 'string') {
      throw new Error('Query is required and must be a string');
    }
    
    if (args.query.length > 1000) {
      throw new Error('Query must be less than 1000 characters');
    }
    
    // Check for dangerous SQL keywords
    const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
    const queryLower = args.query.toLowerCase();
    
    for (const keyword of dangerousKeywords) {
      if (queryLower.includes(keyword)) {
        throw new Error(`Query contains dangerous keyword: ${keyword}`);
      }
    }
  }

  // Logging method
  private logRequest(toolName: string, clientId: string, success: boolean, error?: string): void {
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'ERROR';
    const logMessage = `[${timestamp}] MCP Request: ${toolName} | Client: ${clientId} | Status: ${status}`;
    
    if (error) {
      console.error(`${logMessage} | Error: ${error}`);
    } else {
      console.log(logMessage);
    }
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
      const clientId = Math.random().toString(36).substring(7); // Generate a simple client ID

      try {
        // Rate limiting check
        if (!this.checkRateLimit(clientId)) {
          this.logRequest(name, clientId, false, 'Rate limit exceeded');
          return {
            content: [
              {
                type: 'text',
                text: 'Rate limit exceeded. Maximum 30 requests per minute allowed.',
              },
            ],
            isError: true,
          };
        }

        // Input validation
        switch (name) {
          case 'query_projects':
            this.validateQueryProjectsInput(args);
            break;
          case 'get_project_details':
          case 'get_project_comments':
            this.validateProjectIdInput(args);
            break;
          case 'get_user_projects':
            this.validateUserIdInput(args);
            break;
          case 'execute_custom_query':
            this.validateCustomQueryInput(args);
            break;
          case 'get_categories':
          case 'get_platform_stats':
            // No validation needed for these tools
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Execute the tool
        let result;
        switch (name) {
          case 'query_projects':
            result = await this.queryProjects(args);
            break;
          case 'get_project_details':
            result = await this.getProjectDetails(args);
            break;
          case 'get_user_projects':
            result = await this.getUserProjects(args);
            break;
          case 'get_categories':
            result = await this.getCategories();
            break;
          case 'get_project_comments':
            result = await this.getProjectComments(args);
            break;
          case 'get_platform_stats':
            result = await this.getPlatformStats();
            break;
          case 'execute_custom_query':
            result = await this.executeCustomQuery(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        this.logRequest(name, clientId, true);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logRequest(name, clientId, false, errorMessage);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async queryProjects(args: { category?: string; limit?: number; sortBy?: 'recent' | 'popular' | 'featured'; search?: string }) {
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
  }

  private async getProjectDetails(args: { projectId: string }) {
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
  }

  private async getUserProjects(args: { userId: string }) {
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
  }

  private async getCategories() {
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
  }

  private async getProjectComments(args: { projectId: string }) {
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
  }

  private async getPlatformStats() {
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

    const uniqueUsersCount = new Set(uniqueUsers?.map((p: { user_id: string }) => p.user_id)).size;

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
  }

  private async executeCustomQuery(args: { query: string }) {
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
