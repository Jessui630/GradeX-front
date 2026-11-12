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
  await expect(page.getByRole('link', { name: 'Crear cuenta' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveCount(1)
  await expect(page.getByRole('navigation', { name: 'Acceso' })).toHaveCount(0)
  await expect(
    page.getByText(
      'Registro para solicitantes. Tu contraseña nunca se guarda en texto plano.',
    ),
  ).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('01-landing.png'), fullPage: true })

  const enlaceSaltar = page.getByRole('link', { name: 'Saltar al contenido' })
  await expect(enlaceSaltar).not.toBeInViewport()
  await page.keyboard.press('Tab')
  await expect(enlaceSaltar).toBeInViewport()
  await page.evaluate(() => document.activeElement?.blur())

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('14-landing-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1280, height: 720 })

  const pwaActiva = await page.evaluate(async () => {
    const registros = await navigator.serviceWorker?.getRegistrations()
    return Boolean(registros?.length)
  })
  expect(pwaActiva).toBe(true)

  await page.getByRole('link', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: /Decide con criterio/ })).toBeVisible()

  await page.getByRole('link', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/registro$/)

  await expect(page.getByPlaceholder('Contraseña', { exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('Confirmar contraseña', { exact: true })).toBeVisible()
  await expect(page.getByText('Mínimo 15 caracteres. Los espacios cuentan.')).toBeVisible()
  await expect(page.getByText('Tu contraseña', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Nunca se guarda en texto plano', { exact: true })).toHaveCount(0)

  const contrasenaEscritorio = await page
    .getByLabel('Contraseña', { exact: true })
    .boundingBox()
  const confirmacionEscritorio = await page
    .getByLabel('Confirmar contraseña')
    .boundingBox()
  expect(contrasenaEscritorio).not.toBeNull()
  expect(confirmacionEscritorio).not.toBeNull()
  expect(Math.abs(contrasenaEscritorio.y - confirmacionEscritorio.y)).toBeLessThan(2)

  await page.setViewportSize({ width: 390, height: 844 })
  const contrasenaMovil = await page.getByLabel('Contraseña', { exact: true }).boundingBox()
  const confirmacionMovil = await page
    .getByLabel('Confirmar contraseña')
    .boundingBox()
  expect(contrasenaMovil).not.toBeNull()
  expect(confirmacionMovil).not.toBeNull()
  expect(Math.abs(contrasenaMovil.x - confirmacionMovil.x)).toBeLessThan(2)
  expect(confirmacionMovil.y).toBeGreaterThan(contrasenaMovil.y)
  await page.screenshot({ path: test.info().outputPath('02b-registro-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1280, height: 720 })

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
  await expect(page.getByRole('heading', { name: 'Aún no tienes solicitudes' })).toBeVisible()
  await expect(
    page.getByText('Cuando hagas tu primera evaluación, aparecerá aquí.'),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Crear evaluación' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('03-panel.png'), fullPage: true })

  await page.getByRole('button', { name: 'Menú de cuenta' }).click()
  await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('09-menu-cuenta.png'), fullPage: true })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeHidden()

  await page.reload()
  await expect(page.getByRole('heading', { name: /Hola, Usuario/ })).toBeVisible()

  const rutaSolicitudesRecientes = /\/api\/solicitudes\?pagina=1&tamanoPagina=3$/
  await page.route(rutaSolicitudesRecientes, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        title: 'An error occurred while processing your request.',
        status: 500,
      }),
    }),
  )
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'No pudimos cargar tus solicitudes' }),
  ).toBeVisible()
  await expect(page.getByText('Intenta de nuevo en unos momentos.')).toBeVisible()
  await expect(page.getByText('An error occurred while processing your request.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('15-dashboard-error.png'), fullPage: true })

  await page.unroute(rutaSolicitudesRecientes)
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Aún no tienes solicitudes' })).toBeVisible()

  await page.goto('/app/administracion')
  await expect(page.getByRole('heading', { name: /no está disponible para tu rol/ })).toBeVisible()
  await page.goto('/app')

  await page.getByRole('link', { name: 'Perfil', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()
  await expect(page.getByText(correo)).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('10-perfil.png'), fullPage: true })
  await page.getByRole('link', { name: 'Resumen' }).click()
  await expect(page.getByRole('heading', { name: /Hola, Usuario/ })).toBeVisible()

  await page.getByRole('link', { name: 'Nueva evaluación' }).first().click()
  await expect(page).toHaveURL(/\/app\/evaluaciones\/nueva$/)
  await page.getByRole('button', { name: /Sneakers/ }).click()
  await expect(page.getByRole('heading', { name: 'Datos del producto' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('12-paso-producto.png'), fullPage: true })

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
  await expect(page.getByText('No indicado')).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('13-paso-revision.png'), fullPage: true })
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
  await page.screenshot({ path: test.info().outputPath('11-mobile-menu.png'), fullPage: true })

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
