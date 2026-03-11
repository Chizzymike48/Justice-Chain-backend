import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JusticeChain API',
      version: '1.0.0',
      description: 'Transparency and accountability platform for justice systems in Africa',
      contact: {
        name: 'JusticeChain Team',
        email: 'support@africajustice.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api/v1',
        description: 'Development Server',
      },
      {
        url: 'https://africajustice.onrender.com/api/v1',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        Report: {
          type: 'object',
          required: ['title', 'description', 'category'],
          properties: {
            id: { type: 'string', format: 'objectId' },
            title: { type: 'string', minLength: 5 },
            description: { type: 'string', minLength: 10 },
            category: { type: 'string', enum: ['corruption', 'fraud', 'embezzlement', 'other'] },
            status: { type: 'string', enum: ['open', 'pending', 'investigating', 'resolved', 'rejected'] },
            userId: { type: 'string' },
            office: { type: 'string' },
            amount: { type: 'number' },
            source: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Evidence: {
          type: 'object',
          required: ['caseId', 'fileName'],
          properties: {
            id: { type: 'string', format: 'objectId' },
            caseId: { type: 'string' },
            fileName: { type: 'string' },
            s3Key: { type: 'string' },
            s3Url: { type: 'string' },
            fileSize: { type: 'number' },
            mimeType: { type: 'string' },
            status: { type: 'string', enum: ['queued', 'uploading', 'uploaded', 'rejected'] },
            uploadedBy: { type: 'string' },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [
    './src/routes/health.routes.ts',
    './src/routes/auth.routes.ts',
    './src/routes/report.routes.ts',
    './src/routes/evidence.routes.ts',
    './src/routes/verification.routes.ts',
    './src/routes/export.routes.ts',
    './src/routes/analytics.routes.ts',
    './src/routes/admin.routes.ts',
  ],
}

let specs: any

try {
  specs = swaggerJsdoc(options)
} catch (error) {
  console.error('❌ Error generating Swagger specs:', error)
  specs = {} // Fallback empty spec
}

export const setupSwagger = (app: Express): void => {
  try {
    app.use(
      '/api/v1/api-docs',
      swaggerUi.serve as any,
      swaggerUi.setup(specs, {
        swaggerOptions: {
          persistAuthorization: true,
          displayOperationId: false,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
        },
        customCss: '.swagger-ui { --spacing-unit: 20px; }',
      }) as any
    )

    // Also mount at root for easier access
    app.use(
      '/api-docs',
      swaggerUi.serve as any,
      swaggerUi.setup(specs) as any
    )

    console.log('📚 Swagger documentation available at /api-docs and /api/v1/api-docs')
  } catch (error) {
    console.error('❌ Error setting up Swagger:', error)
  }
}
