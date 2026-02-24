/**
 * Trending score algorithm for IlliniHunt.
 *
 * Inspired by Hacker News' ranking formula but adapted for a university
 * project platform where engagement velocity matters more than raw totals.
 *
 * Formula:
 *   score = (votes + comments * COMMENT_WEIGHT)
 *           / (ageInHours + GRAVITY_OFFSET) ^ GRAVITY
 *
 * - votes/comments measure engagement signal strength
 * - Comments are weighted higher than votes because they signal deeper interest
 * - Age applies time decay: newer projects rank higher at equal engagement
 * - GRAVITY controls how aggressively older projects decay
 * - GRAVITY_OFFSET prevents division-by-zero and smooths very new projects
 */

export type TrendingPeriod = 'today' | 'week' | 'month' | 'all'

// Trending algorithm constants
const COMMENT_WEIGHT = 2
const GRAVITY = 1.8
const GRAVITY_OFFSET = 2

// Pool size configuration for trending projects
export const TRENDING_POOL_MULTIPLIER = 5
export const MIN_TRENDING_POOL_SIZE = 50
export const FEATURED_PROJECTS_COUNT = 30

export interface ScoredProject<T> {
  project: T
  score: number
  ageHours: number
}

/** Calculate trending score for a single project. */
export function trendingScore(
  upvotes: number,
  comments: number,
  createdAt: string | null,
  now: Date = new Date(),
): number {
  const created = createdAt ? new Date(createdAt) : now
  const ageMs = Math.max(now.getTime() - created.getTime(), 0)
  const ageHours = ageMs / (1000 * 60 * 60)

  const signal = upvotes + comments * COMMENT_WEIGHT
  const score = signal / Math.pow(ageHours + GRAVITY_OFFSET, GRAVITY)
  return score
}

/** Filter cutoff date for a given period. */
export function periodCutoff(period: TrendingPeriod, now: Date = new Date()): Date | null {
  switch (period) {
    case 'today': {
      const d = new Date(now)
      d.setHours(d.getHours() - 24)
      return d
    }
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
    case 'month': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d
    }
    case 'all':
      return null
  }
}

/**
 * Rank an array of projects by trending score.
 *
 * Generic over the project type -- only requires upvotes_count,
 * comments_count, and created_at fields.
 */
export function rankByTrending<
  T extends {
    upvotes_count: number | null
    comments_count: number | null
    created_at: string | null
  },
>(projects: T[], period: TrendingPeriod = 'week'): T[] {
  const now = new Date()
  const cutoff = periodCutoff(period, now)

  const filtered = cutoff
    ? projects.filter((p) => {
        if (!p.created_at) return false
        return new Date(p.created_at) >= cutoff
      })
    : projects

  const scored = filtered.map((project) => ({
    project,
    score: trendingScore(
      project.upvotes_count ?? 0,
      project.comments_count ?? 0,
      project.created_at,
      now,
    ),
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.map((s) => s.project)
}

/** Human-readable label for each period. */
export function periodLabel(period: TrendingPeriod): string {
  switch (period) {
    case 'today':
      return 'Today'
    case 'week':
      return 'This Week'
    case 'month':
      return 'This Month'
    case 'all':
      return 'All Time'
  }
}
