// USER ROLES
export const USER_ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official',
  ADMIN: 'admin',
  INVESTIGATOR: 'investigator',
} as const

// REPORT TYPES
export const REPORT_TYPES = {
  CORRUPTION: 'corruption',
  CIVIC: 'civic',
} as const

// CORRUPTION CATEGORIES
export const CORRUPTION_CATEGORIES = {
  BRIBERY: 'bribery_extortion',
  EMBEZZLEMENT: 'embezzlement_theft',
  FRAUD: 'fraud_forgery',
  NEPOTISM: 'nepotism_favoritism',
  ABUSE_OF_POWER: 'abuse_of_power',
  COLLUSION: 'collusion_kickbacks',
} as const

// CIVIC ISSUE CATEGORIES
export const CIVIC_CATEGORIES = {
  ROADS: 'roads_infrastructure',
  WATER: 'water_sanitation',
  ELECTRICITY: 'electricity',
  WASTE: 'waste_management',
  HEALTH: 'health_services',
  EDUCATION: 'education',
  SECURITY: 'security',
  OTHER: 'other',
} as const

// REPORT STATUS
export const REPORT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FLAGGED: 'flagged',
} as const

// URGENCY LEVELS
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

// EVIDENCE TYPES
export const EVIDENCE_TYPES = {
  PHOTO: 'photo',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  LIVE_STREAM: 'live_stream',
} as const

// VERIFICATION VOTE
export const VERIFICATION_VOTE = {
  TRUE: 'true',
  FALSE: 'false',
} as const

// OFFICIAL STATUS
export const OFFICIAL_STATUS = {
  TRUSTED: 'trusted',
  WARNING: 'warning',
  HIGH_RISK: 'high_risk',
  SUSPENDED: 'suspended',
  REMOVED: 'removed',
} as const

// PROJECT STATUS
export const PROJECT_STATUS = {
  ON_TRACK: 'on_track',
  DELAYED: 'delayed',
  RED_FLAG: 'red_flag',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

// MILESTONE STATUS
export const MILESTONE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
} as const

// PETITION STATUS
export const PETITION_STATUS = {
  ACTIVE: 'active',
  SUCCESSFUL: 'successful',
  CLOSED: 'closed',
} as const

// POLL STATUS
export const POLL_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
} as const

// TRUST SCORE LEVELS
interface TrustLevel {
  min: number
  max: number
  weight: number
  label: string
}

export const TRUST_LEVELS: Record<string, TrustLevel> = {
  NEW: { min: 0, max: 20, weight: 0.1, label: 'New User' },
  BRONZE: { min: 21, max: 40, weight: 0.3, label: 'Bronze' },
  SILVER: { min: 41, max: 60, weight: 0.5, label: 'Silver' },
  GOLD: { min: 61, max: 80, weight: 0.8, label: 'Gold' },
  PLATINUM: { min: 81, max: 100, weight: 1.0, label: 'Platinum' },
}

// JUSTICE POINTS REWARDS
export const JUSTICE_POINTS = {
  VERIFICATION: 10,
  REPORT_VERIFIED: 50,
  CORRUPTION_EXPOSED: 100,
  FIRST_REPORT: 25,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
} as const

// POINTS REDEMPTION
interface RedemptionCash {
  points: number
  value: number
  currency: string
}

interface RedemptionAirtime {
  points: number
  value: number
  currency: string
}

interface RedemptionPremium {
  points: number
  description: string
}

export const POINTS_REDEMPTION = {
  CASH_5K: { points: 500, value: 5000, currency: 'NGN' } as RedemptionCash,
  CASH_10K: { points: 1000, value: 10000, currency: 'NGN' } as RedemptionCash,
  AIRTIME_10K: { points: 1000, value: 10000, currency: 'NGN' } as RedemptionAirtime,
  PREMIUM_6M: {
    points: 5000,
    description: '6 months premium access',
  } as RedemptionPremium,
  CASH_100K: { points: 10000, value: 100000, currency: 'NGN' } as RedemptionCash,
}

// FILE SIZE LIMITS (in bytes)
export const FILE_LIMITS = {
  PHOTO: 10 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
  AUDIO: 50 * 1024 * 1024,
  DOCUMENT: 10 * 1024 * 1024,
} as const

// ALLOWED FILE TYPES
export const ALLOWED_FILE_TYPES = {
  PHOTO: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  VIDEO: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/m4a'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const

// NOTIFICATION TYPES
export const NOTIFICATION_TYPES = {
  REPORT_VERIFIED: 'report_verified',
  REPORT_REJECTED: 'report_rejected',
  NEW_VERIFICATION: 'new_verification',
  OFFICIAL_RESPONSE: 'official_response',
  PETITION_MILESTONE: 'petition_milestone',
  POINTS_EARNED: 'points_earned',
  INVESTIGATION_UPDATE: 'investigation_update',
} as const

// RESPONSE TIME THRESHOLDS (in hours)
export const RESPONSE_THRESHOLDS = {
  EXCELLENT: 2,
  GOOD: 12,
  AVERAGE: 24,
  POOR: 48,
  CRITICAL: 72,
} as const

// GEOLOCATION VERIFICATION RADIUS (in meters)
export const GEO_VERIFICATION_RADIUS = 5000

// CACHE DURATIONS (in seconds)
export const CACHE_DURATION = {
  ANALYTICS: 300,
  OFFICIALS: 600,
  PROJECTS: 300,
  LEADERBOARD: 900,
  TRENDING: 180,
} as const

// RATE LIMITING
interface RateLimitConfig {
  windowMs: number
  max: number
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
  REPORTS: { windowMs: 60 * 60 * 1000, max: 10 },
  VERIFICATION: { windowMs: 60 * 60 * 1000, max: 100 },
  AI_CHAT: { windowMs: 15 * 60 * 1000, max: 40 },
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
}

// PAGINATION
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// OFFICIAL SCORE WEIGHTS
export const SCORE_WEIGHTS = {
  RESPONSE_RATE: 0.25,
  PROJECTS_COMPLETED: 0.25,
  BUDGET_TRANSPARENCY: 0.2,
  CORRUPTION_REPORTS: 0.2,
  CITIZEN_SATISFACTION: 0.1,
} as const
