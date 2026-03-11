import { createClient, RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null

const connectRedis = async (): Promise<RedisClientType | null> => {
  if (process.env.ENABLE_REDIS === 'false') {
    console.warn('⚠️ Redis disabled via ENABLE_REDIS=false')
    return null
  }
  try {
    const redisUrl = process.env.REDIS_URL?.trim()
    const host = process.env.REDIS_HOST || 'localhost'
    const port = parseInt(process.env.REDIS_PORT || '6379', 10)
    const password = process.env.REDIS_PASSWORD || undefined

    redisClient = createClient({
      socket: {
        connectTimeout: 5000, // 5 second timeout
        ...(redisUrl ? {} : { host, port }),
      },
      ...(redisUrl ? { url: redisUrl } : {}),
      password,
    })

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('🔄 Redis Client Connecting...')
    })

    redisClient.on('ready', () => {
      console.log('✅ Redis Client Ready')
    })

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis Client Reconnecting...')
    })

    // Connect with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      ),
    ])

    return redisClient
  } catch (error) {
    console.error('❌ Redis connection error:', (error as Error).message)
    console.warn('⚠️ Continuing without Redis cache')
    // Clean up the client to prevent hanging connections
    if (redisClient) {
      try {
        await redisClient.quit()
      } catch {
        // Ignore cleanup errors
      }
      redisClient = null
    }
    return null
  }
}

const getFromCache = async (key: string): Promise<unknown> => {
  if (!redisClient || !redisClient.isReady) return null

  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

const setToCache = async (
  key: string,
  value: unknown,
  expirationInSeconds = 3600
): Promise<boolean> => {
  if (!redisClient || !redisClient.isReady) return false

  try {
    await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Redis SET error:', error)
    return false
  }
}

const deleteFromCache = async (key: string): Promise<boolean> => {
  if (!redisClient || !redisClient.isReady) return false

  try {
    await redisClient.del(key)
    return true
  } catch (error) {
    console.error('Redis DELETE error:', error)
    return false
  }
}

const clearCache = async (pattern = '*'): Promise<boolean> => {
  if (!redisClient || !redisClient.isReady) return false

  try {
    const keys = await redisClient.keys(pattern)
    if (keys.length > 0) {
      await redisClient.del(keys)
    }
    return true
  } catch (error) {
    console.error('Redis CLEAR error:', error)
    return false
  }
}

export {
  connectRedis,
  getFromCache,
  setToCache,
  deleteFromCache,
  clearCache,
}

export const getRedisClient = (): RedisClientType | null => redisClient
