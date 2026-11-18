# GradeX Front

Aplicación React 19 + Vite 8 + PWA para el acceso y los espacios de trabajo de GradeX.

## Requisitos

- Node.js 20 o superior.
- Backend GradeX disponible en `http://localhost:5048` para desarrollo.

## Instalación

```powershell
npm ci
```

## Configuración

La URL del API se toma de `VITE_API_URL`. Si no se define, se usa `/api` y Vite
redirige las solicitudes al backend local durante el desarrollo.

```powershell
Copy-Item .env.example .env.local
```

Para un frontend y un API en orígenes distintos, define la URL completa y revisa
`Cors:AllowedOrigins` en el backend. En ese escenario también debe habilitarse
`Sesion:CrossSite` para que las cookies se emitan con `SameSite=None; Secure`.
No incluyas secretos en variables `VITE_`: son públicas en el bundle.

## Comandos

```powershell
npm run dev
npm run lint
npm test
npm run build
npm run preview
npx playwright install chromium
npm run test:coverage
npm run test:e2e
```

`npm run test:coverage` ejecuta las pruebas con `c8` y genera `coverage/lcov.info` y el resumen en texto. El umbral no está fijado: el porcentaje real se consulta en el artefacto, no se declara manualmente. El CI publica `coverage/` como artefacto.

`npm test` ejecuta las pruebas deterministas de validación, formato y mensajes de error con el runner de Node. `npm run test:e2e` construye la PWA, levanta el backend de integración y Chromium real, y recorre registro, login, nueva evaluación, bloqueo de categoría de un borrador, reemplazo de evidencia, envío, consulta y logout. Las capturas quedan en `test-results/`, excluido de Git.

## Rutas de la aplicación

- `/` landing pública.
- `/login` y `/registro`.
- `/app` resumen de sesión.
- `/app/evaluaciones/nueva` flujo guiado de producto y evidencia.
- `/app/solicitudes` listado real del propietario.
- `/app/solicitudes/:id` detalle, seguimiento, evaluación y evidencia privada.
- `/app/notificaciones` avisos de cambios, evidencia y certificados.
- `/app/perfil` edición de nombre, preferencias de aviso y contraseña.
- `/app/especialista` asignaciones del especialista autenticado.
- `/app/especialista/asignaciones/:id` evaluación por criterios, dictamen y certificado.
- `/app/administracion` asignaciones, especialistas y catálogo.
- `/verificar` y `/verificar/:token` verificación pública de certificados.
- `/app/sin-permiso` y ruta 404.

La navegación del solicitante se limita a Resumen, Nueva evaluación, Mis solicitudes, Perfil y Cerrar sesión. Los roles sin módulos implementados solo ven Resumen, Perfil y Cerrar sesión.

## Servidor de producción Node 24

`server.mjs` sirve `dist` con fallback SPA, tipos MIME correctos, caché para assets y cabeceras de seguridad. También actúa como proxy same-origin de `/api` hacia `BACKEND_ORIGIN` (por defecto, el App Service verificado `https://gradex-api-bxbrgzbvf8bxa6h8.westus-01.azurewebsites.net`). Esto evita exponer una URL de API distinta en el navegador y mantiene cookies/CSRF en el mismo origen.

```powershell
$env:BACKEND_ORIGIN = 'https://gradex-api-bxbrgzbvf8bxa6h8.westus-01.azurewebsites.net'
$env:PORT = '8080'
node server.mjs
```

El workflow `.github/workflows/develop_gradex-front.yml` compila, ejecuta lint/tests, empaqueta `dist`, `server.mjs` y `deploy/package.json`, despliega el ZIP en `gradex-front` y configura el inicio con `node server.mjs`. No se debe usar `vite preview` como servidor definitivo.

## Integración con el API

- `POST /api/cuentas`: registro exclusivo de solicitantes.
- `GET /api/sesiones/csrf`: prepara el token CSRF de la solicitud.
- `POST /api/sesiones`: inicia sesión y establece la cookie HttpOnly.
- `GET /api/sesiones/actual`: consulta la sesión y los roles confirmados.
- `DELETE /api/sesiones/actual`: invalida la sesión en el servidor.
- `GET /api/catalogo/categorias`: categorías activas del catálogo.
- `GET /api/catalogo/categorias/{id}/marcas`: marcas disponibles para la categoría.
- `GET /api/catalogo/categorias/{id}/requisitos`: campos y evidencias requeridas.
- `POST /api/solicitudes`: crea un borrador idempotente.
- `POST /api/solicitudes/{id}/evidencias`: sube una imagen multipart.
- `POST /api/solicitudes/{id}/enviar`: valida requisitos y cambia a Pendiente de asignación.
- `GET /api/solicitudes` y `GET /api/solicitudes/{id}`: consulta del propietario.

Las solicitudes usan `credentials: 'include'`. La contraseña nunca se guarda en
`localStorage`, `sessionStorage` ni en la URL. Las imágenes se solicitan como blob autenticado y no se cachean en la PWA. Los errores del API se presentan como mensajes comprensibles sin mostrar detalles internos.

## SonarQube Cloud y cobertura

El repositorio ya está vinculado a SonarQube Cloud (SonarCloud) mediante la integración de GitHub. El análisis automático publica el check `SonarCloud Code Analysis` y el Quality Gate del PR; no se crea una instancia SonarQube Server ni se añaden servicios de pago.

El análisis automático **no importa cobertura**. `npm run test:coverage` genera un LCOV real en `coverage/lcov.info` y el CI lo publica como artefacto. Para importarlo a SonarCloud hace falta configurar el secreto `SONAR_TOKEN` y ejecutar un scanner con `sonar.javascript.lcov.reportPaths=coverage/lcov.info`. Si se habilita el scanner, debe sustituir al análisis automático, no ejecutarse en paralelo, para no duplicar análisis. Sin ese token no se declara cobertura importada.

El E2E `sprint2-sprint3.spec.js` usa `sqlcmd` contra `GradeX_IntegrationTests` para preparar roles y un especialista de prueba, y limpia solicitudes previas antes de ejecutarse. No se ejecuta en el CI hospedado porque requiere SQL Server LocalDB; se ejecuta localmente con `npm run test:e2e`.
