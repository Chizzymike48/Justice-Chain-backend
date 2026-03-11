import type { Model, Document, FilterQuery } from 'mongoose'

/**
 * Pagination configuration constants
 */
export const PAGINATION_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 500,
  MIN_LIMIT: 1,
  DEFAULT_PAGE: 1,
}

/**
 * Pagination response interface
 */
export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  totalPages: number
}

/**
 * Generic paginate function for scalable queries
 * Replaces duplicated pagination logic across controllers
 * 
 * @param model - Mongoose model
 * @param filters - Query filters
 * @param limit - Items per page (clamped to MAX_LIMIT)
 * @param page - Page number (1-indexed)
 * @param sort - Sort criteria (default: {createdAt: -1})
 * @returns Pagination response with items and metadata
 * 
 * @example
 * const result = await paginate(Report, { status: 'open' }, 20, 1);
 * // Returns { items: [...], total: 100, page: 1, limit: 20, hasMore: true, totalPages: 5 }
 */
export async function paginate<T extends Document>(
  model: Model<T>,
  filters: FilterQuery<T> = {},
  limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
  sort: Record<string, 1 | -1> = { createdAt: -1 }
): Promise<PaginationResponse<T>> {
  try {
    // Clamp limit to safe range
    const safeLimitToUse = Math.min(
      Math.max(limit, PAGINATION_CONSTANTS.MIN_LIMIT),
      PAGINATION_CONSTANTS.MAX_LIMIT
    )

    // Ensure page is at least 1
    const safePage = Math.max(page, PAGINATION_CONSTANTS.DEFAULT_PAGE)

    // Calculate skip for database query
    const skip = (safePage - 1) * safeLimitToUse

    // Execute count and find in parallel for performance
    const [items, total] = await Promise.all([
      model.find(filters).sort(sort).limit(safeLimitToUse).skip(skip).lean(),
      model.countDocuments(filters),
    ])

    const totalPages = Math.ceil(total / safeLimitToUse)
    const hasMore = safePage < totalPages

    return {
      items: items as T[],
      total,
      page: safePage,
      limit: safeLimitToUse,
      hasMore,
      totalPages,
    }
  } catch (error) {
    console.error('Pagination error:', error)
    throw error
  }
}

/**
 * Parse pagination parameters from request query
 * Safely converts string query params to numbers
 * 
 * @param limitStr - Limit as string
 * @param pageStr - Page as string
 * @returns Object with parsed limit and page
 */
export function parsePaginationParams(
  limitStr?: string,
  pageStr?: string
): { limit: number; page: number } {
  let limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT
  let page = PAGINATION_CONSTANTS.DEFAULT_PAGE

  if (limitStr) {
    const parsed = parseInt(limitStr, 10)
    if (!isNaN(parsed)) {
      limit = parsed
    }
  }

  if (pageStr) {
    const parsed = parseInt(pageStr, 10)
    if (!isNaN(parsed)) {
      page = parsed
    }
  }

  return { limit, page }
}

/**
 * Build MongoDB filter query from request params
 * Centralizes filter construction logic
 * 
 * @param filters - Object with filter criteria
 * @returns MongoDB query object
 */
export function buildFilterQuery(filters: Record<string, any>): Record<string, any> {
  const query: Record<string, any> = {}

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    // Handle date range queries
    if (key === 'startDate' || key === 'endDate') {
      if (!query.createdAt) {
        query.createdAt = {}
      }
      if (key === 'startDate') {
        query.createdAt.$gte = new Date(value)
      } else {
        query.createdAt.$lte = new Date(value)
      }
    } else if (key === 'status' || key === 'category') {
      // Exact match for status/category
      query[key] = value
    } else if (key === 'userId' || key === 'createdBy') {
      // Exact match for user identifiers
      query[key] = value
    }
  })

  return query
}
