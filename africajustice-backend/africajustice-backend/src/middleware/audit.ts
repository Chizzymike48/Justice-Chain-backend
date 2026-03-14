import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth'

export const auditWriteAction = (resource: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const startedAt = Date.now()

    res.on('finish', () => {
      const payload = {
        event: 'audit.write',
        resource,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        actor: req.user?.id || 'anonymous',
        actorRole: req.user?.role || 'unknown',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      }

      console.info(JSON.stringify(payload))
    })

    next()
  }
}

