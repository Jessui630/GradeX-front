import assert from 'node:assert/strict'
import test from 'node:test'
import { securityHeaders } from './server.mjs'

test('el servidor de producción publica cabeceras de seguridad y HSTS', () => {
  assert.equal(securityHeaders['X-Content-Type-Options'], 'nosniff')
  assert.equal(securityHeaders['X-Frame-Options'], 'DENY')
  assert.equal(securityHeaders['Referrer-Policy'], 'no-referrer')
  assert.equal(securityHeaders['X-Permitted-Cross-Domain-Policies'], 'none')
  assert.match(securityHeaders['Strict-Transport-Security'], /max-age=31536000/)
  assert.match(securityHeaders['Content-Security-Policy'], /frame-ancestors 'none'/)
})
