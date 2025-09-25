# IlliniHunt MCP Server

This is a Model Context Protocol (MCP) server that provides database access to the IlliniHunt application. It allows AI assistants to query the Supabase PostgreSQL database safely and efficiently.

## Features

- **Query Projects**: Search and filter projects by category, popularity, or recency
- **Project Details**: Get detailed information about specific projects
- **User Projects**: Retrieve all projects by a specific user
- **Categories**: List all active project categories
- **Comments**: Get comments for specific projects
- **Platform Stats**: Retrieve platform statistics
- **Custom Queries**: Execute read-only SQL queries (SELECT only)

## Installation

1. Navigate to the mcp-server directory:
   ```bash
   cd mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create .env.local in the parent directory with your Supabase credentials)

4. Build the server:
   ```bash
   npm run build
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Available Tools

### query_projects
Query projects with optional filters:
- `category`: Filter by category name
- `limit`: Maximum number of projects (default: 10)
- `sortBy`: Sort order ('recent', 'popular', 'featured')
- `search`: Search term for project name or tagline

### get_project_details
Get detailed information about a specific project:
- `projectId`: UUID of the project

### get_user_projects
Get all projects by a specific user:
- `userId`: UUID of the user

### get_categories
Get all active categories (no parameters)

### get_project_comments
Get comments for a specific project:
- `projectId`: UUID of the project

### get_platform_stats
Get platform statistics (no parameters)

### execute_custom_query
Execute a custom SQL query (SELECT only):
- `query`: SQL SELECT query to execute

## Security

- **Rate Limiting**: Maximum 30 requests per minute per client
- **Input Validation**: Comprehensive validation for all tool inputs
- **UUID Validation**: Strict UUID format validation for IDs
- **SQL Injection Protection**: Dangerous SQL keywords blocked
- **Query Length Limits**: Maximum 1000 characters for custom queries
- **Read-Only Access**: Only SELECT queries allowed for custom queries
- **Environment Variables**: All sensitive data stored in environment variables
- **Request Logging**: All requests logged with timestamps and client IDs
- **Error Handling**: Proper error handling with detailed logging

## Database Schema

The server connects to the IlliniHunt Supabase database with the following main tables:
- `users`: User profiles and information
- `projects`: Project listings with metadata
- `categories`: Project categories
- `votes`: User votes on projects
- `comments`: Project comments and discussions
- `bookmarks`: User bookmarks
- `collections`: User-created project collections

## Error Handling

The server includes comprehensive error handling:
- Database connection errors
- Query execution errors
- Input validation errors
- Security violations

All errors are returned in a structured format with appropriate error messages.
