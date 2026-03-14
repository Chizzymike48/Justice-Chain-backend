const validateEnv = (): void => {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  const REQUIRED_ALWAYS = ['JWT_SECRET']
  const OPTIONAL_DB = ['MONGODB_URI']
  const REQUIRED_PROD = ['STREAM_INGEST_BASE_URL', 'STREAM_PLAYBACK_BASE_URL']

  const required = [...REQUIRED_ALWAYS]
  if (process.env.NODE_ENV === 'production') {
    required.push(...REQUIRED_PROD)
  }

  const missingRequired = required.filter((key) => !process.env[key])
  const missingOptional = OPTIONAL_DB.filter((key) => !process.env[key])

  if (missingRequired.length > 0) {
    const error = new Error(
      `Missing REQUIRED environment variables: ${missingRequired.join(', ')}`
    ) as Error & { statusCode?: number }
    error.statusCode = 500
    throw error
  }

  if (missingOptional.length > 0) {
    console.warn(`⚠️ Missing optional vars (graceful fallback): ${missingOptional.join(', ')}`)
    console.warn('Set ENABLE_MONGO=false to explicitly disable DB features.')
  }
}

export default validateEnv
