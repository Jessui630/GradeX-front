import { defineConfig } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'

const storage = path.join(os.tmpdir(), 'gradex-playwright-evidencias')

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
  },
  webServer: [
    {
      command:
        'dotnet src\\GradeX.Api\\bin\\Release\\net10.0\\GradeX.Api.dll --urls http://localhost:5048',
      cwd: '../GradeX-back',
      url: 'http://localhost:5048/api/health',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ConnectionStrings__GradeX:
          'Server=(localdb)\\MSSQLLocalDB;Database=GradeX_IntegrationTests;Integrated Security=true;TrustServerCertificate=true',
        Almacenamiento__Evidencias__Ruta: storage,
      },
    },
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 4173',
      cwd: '.',
      url: 'http://127.0.0.1:4173',
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
})
