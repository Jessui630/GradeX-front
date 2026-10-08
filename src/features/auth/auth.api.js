import { env } from '../../config/env'

export async function registerUser(data) {
  const response = await fetch(
    `${env.apiUrl}/auth/register`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(data),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ?? 'No fue posible crear la cuenta',
    )
  }

  return result
}