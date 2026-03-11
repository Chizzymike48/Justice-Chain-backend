const validateEnv = (): void => {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET']
  const REQUIRED_PROD_ENV = ['STREAM_INGEST_BASE_URL', 'STREAM_PLAYBACK_BASE_URL']

  const required = [...REQUIRED_ENV]
  if (process.env.NODE_ENV === 'production') {
    required.push(...REQUIRED_PROD_ENV)
  }

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    ) as Error & { statusCode?: number }
    error.statusCode = 500
    throw error
  }
}

export default validateEnv
