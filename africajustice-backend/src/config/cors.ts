import type { CorsOptions } from 'cors'

const LOCAL_ORIGINS = ['http://localhost:5173', 'http://localhost:3000']
const VERCEL_PREVIEW_REGEX = /^https?:\/\/.+\.vercel\.app$/i

type OriginDecision = {
  exact: Set<string>
  regex: RegExp[]
  allowVercelPreviews: boolean
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const wildcardToRegex = (pattern: string): RegExp => {
  const escaped = escapeRegex(pattern).replace(/\\\*/g, '.*')
  return new RegExp(`^${escaped}$`, 'i')
}

const parseOriginEnv = (originEnv?: string): OriginDecision => {
  const exact = new Set<string>()
  const regex: RegExp[] = []
  const entries = originEnv ? originEnv.split(',').map((entry) => entry.trim()).filter(Boolean) : []

  entries.forEach((entry) => {
    if (entry.includes('*')) {
      regex.push(wildcardToRegex(entry))
    } else {
      exact.add(entry)
    }
  })

  const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS !== 'false'
  const allowLocalhost = process.env.NODE_ENV !== 'production'

  if (allowLocalhost) {
    LOCAL_ORIGINS.forEach((origin) => exact.add(origin))
  }

  return { exact, regex, allowVercelPreviews }
}

const buildOriginValidator = () => {
  const { exact, regex, allowVercelPreviews } = parseOriginEnv(process.env.CORS_ORIGIN)

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
    if (!origin) {
      callback(null, true)
      return
    }

    if (exact.has(origin)) {
      callback(null, true)
      return
    }

    if (regex.some((rule) => rule.test(origin))) {
      callback(null, true)
      return
    }

    if (allowVercelPreviews && VERCEL_PREVIEW_REGEX.test(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  }
}

export const buildCorsOptions = (): CorsOptions => ({
  origin: buildOriginValidator(),
  credentials: true,
})

export const buildSocketCorsOptions = (): { origin: CorsOptions['origin']; credentials: boolean } => ({
  origin: buildOriginValidator(),
  credentials: true,
})
