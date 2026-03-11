process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.SKIP_ENV_VALIDATION = 'true'

import jwt from 'jsonwebtoken'
import request from 'supertest'
import app from '../src/app'

describe('Security boundary enforcement', () => {
  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('blocks unauthenticated write requests on protected routes', async () => {
    const payloads = [
      {
        url: '/api/v1/reports',
        body: {
          title: 'Report title',
          category: 'corruption',
          description: 'This description is long enough to pass validation.',
        },
      },
      {
        url: '/api/v1/verify',
        body: {
          claim: 'This claim text is long enough for validation rules.',
        },
      },
      {
        url: '/api/v1/polls',
        body: {
          question: 'Is this project delayed?',
          options: ['Yes', 'No'],
        },
      },
    ]

    for (const testCase of payloads) {
      const response = await request(app).post(testCase.url).send(testCase.body)
      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    }
  })

  it('rejects invalid bearer tokens', async () => {
    const response = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        title: 'Report title',
        category: 'corruption',
        description: 'This description is long enough to pass validation.',
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('accepts valid auth token and then enforces request validation', async () => {
    const token = jwt.sign(
      {
        id: 'user-1',
        email: 'citizen@example.com',
        role: 'citizen',
      },
      process.env.JWT_SECRET as string,
    )

    const response = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'bad',
        category: 'unknown',
        description: 'short',
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe('Validation failed.')
    expect(Array.isArray(response.body.errors)).toBe(true)
  })

  it('protects analytics endpoints with authentication', async () => {
    const response = await request(app).get('/api/v1/analytics')

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('validates AI chat payload schema before service execution', async () => {
    const response = await request(app)
      .post('/api/v1/ai/chat')
      .send({
        message: 'How many reports are available?',
        preferredLanguage: 'invalid-lang',
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe('Validation failed.')
  })

  it('rate limits repeated login attempts', async () => {
    const requests = Array.from({ length: 6 }).map(() =>
      request(app).post('/api/v1/auth/login').send({
        email: 'not-an-email',
        password: '123456',
      }),
    )

    const responses = await Promise.all(requests)
    const lastResponse = responses[responses.length - 1]

    expect(lastResponse.status).toBe(429)
    expect(lastResponse.body.success).toBe(false)
  })
})

