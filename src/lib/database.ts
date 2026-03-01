/**
 * Barrel re-export for backward compatibility.
 *
 * All service classes have been decomposed into focused modules under
 * src/lib/services/. This file re-exports them so existing imports
 * like `import { ProjectsService } from '@/lib/database'` keep working.
 */

export { ProjectsService } from './services/projects'
export { CategoriesService } from './services/categories'
export { StatsService } from './services/stats'
export { CommentsService } from './services/comments'
export { BookmarkService } from './services/bookmarks'
export { CollectionService } from './services/collections'
