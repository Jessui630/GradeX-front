export class ApiError extends Error {
  constructor(message, { status = 0, errors, retryAfter, problem } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.retryAfter = retryAfter
    this.problem = problem
  }
}
