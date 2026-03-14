import { useMemo } from 'react'

type TrustLevel = 'high' | 'medium' | 'low'

interface UseTrustScoreOptions {
  verifiedCases?: number
  totalCases?: number
  unresolvedCases?: number
}

interface TrustScoreResult {
  score: number
  level: TrustLevel
}

export const useTrustScore = (options: UseTrustScoreOptions = {}): TrustScoreResult => {
  const {
    verifiedCases = 0,
    totalCases = 0,
    unresolvedCases = 0,
  } = options

  return useMemo(() => {
    if (totalCases <= 0) {
      return { score: 50, level: 'medium' as const }
    }

    const verificationRatio = Math.min(1, Math.max(0, verifiedCases / totalCases))
    const unresolvedRatio = Math.min(1, Math.max(0, unresolvedCases / totalCases))
    const computed = Math.round((verificationRatio * 80 + (1 - unresolvedRatio) * 20) * 100) / 100
    const clamped = Math.min(100, Math.max(0, computed))

    let level: TrustLevel = 'medium'
    if (clamped >= 70) {
      level = 'high'
    } else if (clamped < 40) {
      level = 'low'
    }

    return { score: clamped, level }
  }, [totalCases, verifiedCases, unresolvedCases])
}
