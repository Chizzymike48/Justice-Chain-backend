import { Response } from 'express'
import { Report } from '../models/Report'
import { Project } from '../models/Project'
import { Verification } from '../models/Verification'
import { AuthRequest } from '../middleware/auth'
import { getOrCompute, generateCacheKey, CACHE_TTL } from '../services/cacheService'

export const getDashboardMetricsController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const cacheKey = generateCacheKey('dashboard', 'metrics')
    
    const data = await getOrCompute(
      cacheKey,
      async () => {
        const [openReports, projectsTracked, verifiedClaims, confidenceResult, recentReports] = await Promise.all([
          Report.countDocuments({ status: { $in: ['open', 'pending', 'in_review'] } }),
          Project.countDocuments(),
          Verification.countDocuments({ status: 'reviewed' }),
          Verification.aggregate([
            { $match: { status: 'reviewed' } },
            { $group: { _id: null, avg: { $avg: '$confidence' } } },
          ]),
          Report.find().sort({ createdAt: -1 }).limit(5),
        ])

        const avgConfidence = confidenceResult.length > 0 ? Math.round(confidenceResult[0].avg || 0) : 0
        const alerts = recentReports.map((report) => `[${report.category}] ${report.title}`)

        return { openReports, projectsTracked, verifiedClaims, avgConfidence, alerts }
      },
      CACHE_TTL.DASHBOARD
    )

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get dashboard metrics error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics.',
    })
  }
}

export const getDistrictAnalyticsController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const cacheKey = generateCacheKey('analytics', 'district-performance')
    
    const districtPerformance = await getOrCompute(
      cacheKey,
      async () => {
        // Use MongoDB aggregation pipeline instead of in-memory computation
        const results = await Project.aggregate([
          {
            $group: {
              _id: { $ifNull: [{ $trim: { input: '$location' } }, 'Unknown'] },
              totalProgress: { $sum: '$progress' },
              count: { $sum: 1 },
              anomalyCount: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $regexMatch: { input: '$status', regex: 'risk', options: 'i' } },
                        { $regexMatch: { input: '$status', regex: 'delay', options: 'i' } },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              district: '$_id',
              completionRate: {
                $cond: [{ $gt: ['$count', 0] }, { $round: [{ $divide: ['$totalProgress', '$count'] }, 0] }, 0],
              },
              anomalyScore: {
                $cond: [{ $gt: ['$count', 0] }, { $round: [{ $multiply: [{ $divide: ['$anomalyCount', '$count'] }, 100] }, 0] }, 0],
              },
              _id: 0,
            },
          },
          { $sort: { district: 1 } },
        ])

        return results
      },
      CACHE_TTL.ANALYTICS
    )

    return res.json({
      success: true,
      data: {
        districtPerformance,
      },
    })
  } catch (error) {
    console.error('Get district analytics error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve district analytics.',
    })
  }
}

export const getReportAnalyticsController = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { category, status } = req.query as { category?: string; status?: string }

    // Generate cache key based on filters
    const cacheKey = generateCacheKey('analytics', 'reports', category || 'all', status || 'all')

    const data = await getOrCompute(
      cacheKey,
      async () => {
        const filters: { category?: string; status?: string } = {}
        if (category) filters.category = category
        if (status) filters.status = status

        const [total, byStatus, byCategory] = await Promise.all([
          Report.countDocuments(filters),
          Report.aggregate([
            { $match: filters },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          Report.aggregate([
            { $match: filters },
            { $group: { _id: '$category', count: { $sum: 1 } } },
          ]),
        ])

        const statusBreakdown = Object.fromEntries(byStatus.map((s) => [s._id, s.count]))
        const categoryBreakdown = Object.fromEntries(byCategory.map((c) => [c._id, c.count]))

        return { total, statusBreakdown, categoryBreakdown }
      },
      CACHE_TTL.ANALYTICS
    )

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get report analytics error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report analytics.',
    })
  }
}
