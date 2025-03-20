import { describe, expect, it, beforeAll, afterAll } from '@jest/globals'
import Fastify, { FastifyInstance } from 'fastify'
import { healthCheckRouter } from '../../src/routes/healthCheck'

describe('Health Check Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify({
      logger: false,
    })
    await app.register(healthCheckRouter)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('is-alive endpoint returns OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/is-alive',
    })

    expect(response.statusCode).toBe(200)
    expect(response.payload).toBe('OK')
  })

  it('is-healthy endpoint returns OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/is-healthy',
    })

    expect(response.statusCode).toBe(200)
    expect(response.payload).toBe('OK')
  })
})
