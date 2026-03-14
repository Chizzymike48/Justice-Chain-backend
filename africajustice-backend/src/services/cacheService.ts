import { getFromCache, setToCache, deleteFromCache } from '../config/redis'

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const CACHE_TTL = {
  ANALYTICS: 5 * 60, // 5 minutes - analytics data
  DASHBOARD: 2 * 60, // 2 minutes - dashboard summaries
  REPORTS_LIST: 3 * 60, // 3 minutes - paginated reports
  ADMIN_QUEUE: 1 * 60, // 1 minute - admin moderation queues (frequently updated)
  USER_DATA: 10 * 60, // 10 minutes - user metadata
}

/**
 * Cache key generator - centralized for consistency
 */
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return [prefix, ...parts].filter(p => p !== undefined && p !== null).join(':')
}

/**
 * Get cached data with type safety
 * @param key Cache key
 * @returns Cached data or null if not found/expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await getFromCache(key)
    return (data as T) || null
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error)
    return null
  }
}

/**
 * Set data in cache with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds
 */
export async function setCached<T>(key: string, data: T, ttl: number = CACHE_TTL.USER_DATA): Promise<boolean> {
  try {
    return await setToCache(key, data, ttl)
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error)
    return false
  }
}

/**
 * Get from cache or compute and store
 * Pattern for common cache-aside operations
 * 
 * @param key Cache key
 * @param computeFn Function to compute value if not cached
 * @param ttl Time to live in seconds
 * @returns Computed or cached value
 * 
 * @example
 * const analytics = await getOrCompute(
 *   generateCacheKey('analytics', 'district-performance'),
 *   async () => {
 *     return await Project.aggregate([...])
 *   },
 *   CACHE_TTL.ANALYTICS
 * )
 */
export async function getOrCompute<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttl: number = CACHE_TTL.USER_DATA
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await getCached<T>(key)
    if (cached !== null) {
      return cached
    }

    // Compute value if not in cache
    const computed = await computeFn()

    // Store in cache for next time
    await setCached(key, computed, ttl)

    return computed
  } catch (error) {
    console.error(`getOrCompute error for key ${key}:`, error)
    // Fall back to just computing without cache
    return await computeFn()
  }
}

/**
 * Invalidate cache for a pattern
 * Useful after updates to clear related cache entries
 * 
 * @example
 * // After updating a report, invalidate its cache
 * await invalidateCache(generateCacheKey('report', reportId, '*'))
 */
export async function invalidateCache(keyPattern: string): Promise<boolean> {
  try {
    return await deleteFromCache(keyPattern)
  } catch (error) {
    console.error(`Cache invalidation error for pattern ${keyPattern}:`, error)
    return false
  }
}

/**
 * Create a cache key for a model list with filters
 * Ensures consistent cache keys for paginated lists
 * 
 * @example
 * const key = createListCacheKey('report', { status: 'pending', userId: '123' }, 1, 20)
 * // Returns: list:report:pending:123:1:20
 */
export function createListCacheKey(
  modelName: string,
  filters: Record<string, unknown>,
  page: number,
  limit: number
): string {
  const filterKeys = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}`)
    .join('|')

  return generateCacheKey('list', modelName, filterKeys, `page=${page}`, `limit=${limit}`)
}

/**
 * Batch cache operations helper
 * Gets multiple cache keys in parallel
 */
export async function getBatchCached<T>(keys: string[]): Promise<(T | null)[]> {
  return Promise.all(keys.map(key => getCached<T>(key)))
}

/**
 * Set multiple cache entries
 */
export async function setBatchCached<T>(
  entries: Array<{ key: string; data: T; ttl?: number }>,
  defaultTtl: number = CACHE_TTL.USER_DATA
): Promise<boolean[]> {
  return Promise.all(
    entries.map(entry => setCached(entry.key, entry.data, entry.ttl ?? defaultTtl))
  )
}
