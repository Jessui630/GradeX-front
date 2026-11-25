import { defineConfig } from '@playwright/test'
import process from 'node:process'
import path from 'node:path'
import os from 'node:os'

const storage = path.join(os.tmpdir(), 'gradex-playwright-evidencias')
const backDirectory = process.env.GRADEX_BACK_DIR ??
  path.resolve(process.cwd(), '..', 'GradeX-back')
const backDll = path.join(
  'src',
  'GradeX.Api',
  'bin',
  'Release',
  'net10.0',
  'GradeX.Api.dll',
)

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
      command: `dotnet "${backDll}" --urls http://localhost:5048`,
      cwd: backDirectory,
      url: 'http://localhost:5048/api/health',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ConnectionStrings__GradeX:
          'Server=(localdb)\\MSSQLLocalDB;Database=GradeX_IntegrationTests;Integrated Security=true;TrustServerCertificate=true',
        Almacenamiento__Evidencias__Ruta: storage,
        RateLimiting__Registro__PermitLimit: '1000',
        RateLimiting__Login__PermitLimit: '1000',
        RateLimiting__Solicitudes__PermitLimit: '1000',
        RateLimiting__Asignaciones__PermitLimit: '1000',
        RateLimiting__Certificados__PermitLimit: '1000',
        RateLimiting__Global__PermitLimit: '1000',
        Contrasenas__PwnedPasswords__Habilitado: 'false',
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
