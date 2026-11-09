import { test, expect } from '@playwright/test'
import { Buffer } from 'node:buffer'

const correo = `e2e-ui-${Date.now()}@example.test`
const contrasena = 'GradeX-UI-flujo-largo-2026'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

test('registro, sesión, nueva evaluación, evidencia, envío, consulta y logout', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Decide con criterio/ })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('01-landing.png'), fullPage: true })

  const pwaActiva = await page.evaluate(async () => {
    const registros = await navigator.serviceWorker?.getRegistrations()
    return Boolean(registros?.length)
  })
  expect(pwaActiva).toBe(true)

  await page.getByRole('link', { name: 'Crear cuenta' }).first().click()
  await expect(page).toHaveURL(/\/registro$/)
  await page.getByLabel('Nombre completo').fill('Usuario UI Sprint 1')
  await page.getByLabel('Correo electrónico').fill(correo)
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena)
  await page.getByLabel('Confirmar contraseña').fill(contrasena)

  await page.getByRole('button', { name: 'Mostrar contraseña' }).first().click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar contraseña' }).first().click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'password')
  await page.screenshot({ path: test.info().outputPath('02-registro.png'), fullPage: true })

  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Cuenta creada correctamente')).toBeVisible()

  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena)
  await page.getByRole('button', { name: 'Entrar a GradeX' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole('heading', { name: /Hola, Usuario/ })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('03-panel.png'), fullPage: true })

  await page.reload()
  await expect(page.getByRole('heading', { name: /Hola, Usuario/ })).toBeVisible()

  await page.goto('/app/administracion')
  await expect(page.getByRole('heading', { name: /no está disponible para tu rol/ })).toBeVisible()
  await page.goto('/app')

  await page.getByRole('link', { name: 'Perfil', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()
  await expect(page.getByText(correo)).toBeVisible()
  await page.getByRole('link', { name: 'Resumen' }).click()
  await expect(page.getByRole('heading', { name: /Hola, Usuario/ })).toBeVisible()

  await page.getByRole('link', { name: 'Nueva evaluación' }).first().click()
  await expect(page).toHaveURL(/\/app\/evaluaciones\/nueva$/)
  await page.getByRole('button', { name: /Sneakers/ }).click()
  await expect(page.getByRole('heading', { name: 'Datos del producto' })).toBeVisible()

  await page.getByLabel(/Nombre del producto/).fill('Producto UI Sprint 1')
  await page.getByLabel('Modelo', { exact: true }).fill('Modelo UI')
  await page.getByLabel('SKU', { exact: true }).fill('SKU-UI-001')
  await page.getByLabel('Número de serie', { exact: true }).fill('SERIE-UI-001')
  await page.getByLabel('Accesorios', { exact: true }).fill('Caja y cable')
  await page.getByLabel('Descripción', { exact: true }).fill('Producto sintético para la prueba E2E')
  await page.getByRole('button', { name: /Continuar a evidencia/ }).click()

  await expect(page.getByRole('heading', { name: 'Adjunta la evidencia' })).toBeVisible()
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'evidencia-ui.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.locator('.evidence-preview img').first()).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('04-evidencia.png'), fullPage: true })

  await page.getByRole('button', { name: /Revisar solicitud/ }).click()
  await expect(page.getByRole('heading', { name: 'Revisa antes de enviar' })).toBeVisible()
  await expect(page.getByText('Producto UI Sprint 1').first()).toBeVisible()
  await page.getByRole('button', { name: /Enviar solicitud/ }).click()

  await expect(page.getByRole('heading', { name: /Tu evaluación ya está en cola/ })).toBeVisible()
  await expect(page.getByText('Pendiente de asignación').first()).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('05-envio.png'), fullPage: true })

  await page.getByRole('link', { name: 'Ver el detalle' }).click()
  await expect(page).toHaveURL(/\/app\/solicitudes\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Producto UI Sprint 1' })).toBeVisible()
  await expect(page.getByText('Pendiente de asignación').first()).toBeVisible()
  await expect(page.locator('.evidence-detail img').first()).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('06-detalle.png'), fullPage: true })

  await page.getByRole('link', { name: 'Mis solicitudes' }).first().click()
  await expect(page.getByRole('heading', { name: 'Mis solicitudes' })).toBeVisible()
  await expect(page.getByText('Producto UI Sprint 1').first()).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: test.info().outputPath('07-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/app')
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/registro')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('Escribe tu nombre completo.')).toBeVisible()
  await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible()

  await page.getByLabel('Nombre completo').fill('Usuario duplicado')
  await page.getByLabel('Correo electrónico').fill(correo)
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena)
  await page.getByLabel('Confirmar contraseña').fill(contrasena)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('El correo ya está registrado.').first()).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('08-duplicado.png'), fullPage: true })
})
