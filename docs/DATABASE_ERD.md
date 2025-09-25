# IlliniHunt Database Entity Relationship Diagram

This document contains the Entity Relationship Diagram (ERD) for the IlliniHunt database schema.

## Mermaid ERD

```mermaid
erDiagram
    %% Core User Management
    USERS {
        uuid id PK "References auth.users"
        text email UK "Unique email"
        text username UK "Unique username"
        text full_name "Display name"
        text avatar_url "Profile picture"
        text bio "User biography"
        text github_url "GitHub profile"
        text linkedin_url "LinkedIn profile"
        text website_url "Personal website"
        text year_of_study "Academic year"
        text department "Academic department"
        boolean is_verified "Verification status"
        timestamp created_at "Account creation"
        timestamp updated_at "Last update"
    }

    %% Project Categories
    CATEGORIES {
        uuid id PK "Primary key"
        text name UK "Category name"
        text description "Category description"
        text icon "Icon identifier"
        text color "UI color"
        boolean is_active "Active status"
        timestamp created_at "Creation date"
    }

    %% Main Project Data
    PROJECTS {
        uuid id PK "Primary key"
        text name "Project name"
        text tagline "Short description"
        text description "Full description"
        text image_url "Project image"
        text website_url "Live website"
        text github_url "Source code"
        uuid category_id FK "References categories"
        uuid user_id FK "References users"
        integer upvotes_count "Vote count"
        integer comments_count "Comment count"
        text status "active|featured|archived|draft"
        timestamp created_at "Creation date"
        timestamp updated_at "Last update"
    }

    %% Voting System
    VOTES {
        uuid id PK "Primary key"
        uuid user_id FK "References users"
        uuid project_id FK "References projects"
        timestamp created_at "Vote date"
    }

    %% Comment System
    COMMENTS {
        uuid id PK "Primary key"
        text content "Comment text"
        uuid user_id FK "References users"
        uuid project_id FK "References projects"
        uuid parent_id FK "References comments (self)"
        integer thread_depth "Nesting level (0-3)"
        integer likes_count "Like count"
        boolean is_deleted "Soft delete flag"
        timestamp created_at "Creation date"
        timestamp updated_at "Last update"
    }

    %% Comment Likes
    COMMENT_LIKES {
        uuid id PK "Primary key"
        uuid user_id FK "References users"
        uuid comment_id FK "References comments"
        timestamp created_at "Like date"
    }

    %% Bookmarking System
    BOOKMARKS {
        uuid id PK "Primary key"
        uuid user_id FK "References users"
        uuid project_id FK "References projects"
        timestamp created_at "Bookmark date"
    }

    %% Collections System
    COLLECTIONS {
        uuid id PK "Primary key"
        uuid user_id FK "References users"
        text name "Collection name"
        text description "Collection description"
        boolean is_public "Public visibility"
        integer projects_count "Project count"
        timestamp created_at "Creation date"
        timestamp updated_at "Last update"
    }

    %% Collection-Project Relationships
    COLLECTION_PROJECTS {
        uuid id PK "Primary key"
        uuid collection_id FK "References collections"
        uuid project_id FK "References projects"
        timestamp added_at "Addition date"
    }

    %% Database Views
    USER_BOOKMARKS_WITH_PROJECTS {
        uuid id "Bookmark ID"
        uuid user_id "User ID"
        timestamp bookmarked_at "Bookmark date"
        uuid project_id "Project ID"
        text project_name "Project name"
        text tagline "Project tagline"
        text image_url "Project image"
        integer upvotes_count "Project votes"
        text status "Project status"
        timestamp project_created_at "Project creation"
        text project_author "Author username"
        text category_name "Category name"
        text category_color "Category color"
    }

    PUBLIC_COLLECTIONS_WITH_STATS {
        uuid id "Collection ID"
        text name "Collection name"
        text description "Collection description"
        integer projects_count "Project count"
        timestamp created_at "Creation date"
        text owner_username "Owner username"
        text owner_name "Owner full name"
        text owner_avatar "Owner avatar"
    }

    %% Relationships
    USERS ||--o{ PROJECTS : "creates"
    USERS ||--o{ VOTES : "votes"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ COMMENT_LIKES : "likes"
    USERS ||--o{ BOOKMARKS : "bookmarks"
    USERS ||--o{ COLLECTIONS : "owns"

    CATEGORIES ||--o{ PROJECTS : "categorizes"

    PROJECTS ||--o{ VOTES : "receives"
    PROJECTS ||--o{ COMMENTS : "has"
    PROJECTS ||--o{ BOOKMARKS : "bookmarked_in"
    PROJECTS ||--o{ COLLECTION_PROJECTS : "included_in"

    COMMENTS ||--o{ COMMENTS : "replies_to"
    COMMENTS ||--o{ COMMENT_LIKES : "receives"

    COLLECTIONS ||--o{ COLLECTION_PROJECTS : "contains"
```

## Key Relationships

### One-to-Many Relationships
- **Users → Projects**: One user can create many projects
- **Users → Votes**: One user can vote on many projects
- **Users → Comments**: One user can write many comments
- **Users → Bookmarks**: One user can bookmark many projects
- **Users → Collections**: One user can create many collections
- **Categories → Projects**: One category can contain many projects
- **Projects → Votes**: One project can receive many votes
- **Projects → Comments**: One project can have many comments
- **Projects → Bookmarks**: One project can be bookmarked by many users
- **Comments → Comment Likes**: One comment can receive many likes
- **Comments → Comments**: One comment can have many replies (self-referencing)

### Many-to-Many Relationships
- **Collections ↔ Projects**: Many-to-many through `collection_projects` table

### Unique Constraints
- **Votes**: (user_id, project_id) - One vote per user per project
- **Comment Likes**: (user_id, comment_id) - One like per user per comment
- **Bookmarks**: (user_id, project_id) - One bookmark per user per project
- **Collection Projects**: (collection_id, project_id) - One entry per project per collection

## Database Features

### Automatic Counters
- `projects.upvotes_count` - Updated by vote triggers
- `projects.comments_count` - Updated by comment triggers
- `collections.projects_count` - Updated by collection_projects triggers

### Soft Deletes
- Comments use `is_deleted` flag instead of hard deletion

### Nested Comments
- Support for up to 3 levels of comment threading via `thread_depth`

### Views
- `user_bookmarks_with_projects` - Optimized bookmark queries
- `public_collections_with_stats` - Optimized public collection queries

## Current Categories
1. Learning & Education Tools
2. Social & Communication
3. Productivity & Organization
4. Health & Wellness
5. Creative & Entertainment
6. Research & Data Analysis
7. Business & Entrepreneurship
8. Emerging Technology
