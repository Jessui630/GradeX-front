# GradeX Front

Aplicación React 19 + Vite 8 + PWA para el acceso y los espacios de trabajo de GradeX.

## Requisitos

- Node.js 24.x (compatible con Vite 8, Vitest 5 y jsdom 31).
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

`npm test` ejecuta con Vitest las pruebas deterministas de validación, formato, errores HTTP, componentes React y rutas protegidas, en jsdom con React Testing Library. `npm run test:components` filtra las pruebas de componentes. `npm run test:coverage` instrumenta todo el frontend con V8 y genera `coverage/lcov.info`, `coverage/coverage-summary.json` y el resumen en texto. El umbral no está fijado: el porcentaje real se consulta en el artefacto, no se declara manualmente. El CI publica `coverage/` como artefacto.

`npm run test:e2e` conserva Playwright y construye la PWA, levanta el backend de integración y Chromium real, y recorre registro, login, nueva evaluación, bloqueo de categoría de un borrador, reemplazo de evidencia, asignación administrativa, evaluación, evidencia adicional, dictamen, certificado con QR, verificación pública, Mis certificados, perfil y cambio de contraseña. Las capturas quedan en `test-results/`, excluido de Git. El backend se busca en `../GradeX-back` o en la ruta indicada por `GRADEX_BACK_DIR`. El E2E local desactiva Pwned Passwords y eleva los límites de rate limiting solo en el proceso de prueba para que el recorrido sea determinista.

## Rutas de la aplicación

- `/` landing pública.
- `/login` y `/registro`.
- `/app` resumen de sesión.
- `/app/evaluaciones/nueva` flujo guiado de producto y evidencia.
- `/app/solicitudes` listado real del propietario.
- `/app/solicitudes/:id` detalle, seguimiento, evaluación y evidencia privada.
- `/app/certificados` certificados emitidos, calificación, especialidad, QR y verificación.
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

El workflow `.github/workflows/develop_gradex-front.yml` ejecuta lint, pruebas con cobertura, auditoría de dependencias, build y verificación del React real en `push` y `pull_request` de `main`, `develop`, `release` y `feature/**`. La publicación a producción solo se habilita mediante `workflow_dispatch` desde `main` con la confirmación `DEPLOY`, después de que `Build and verify` termine correctamente y con la aprobación del environment `production`. Un `push` a `main` ejecuta CI, pero no publica. En `develop`, `release` y ramas feature solo se ejecuta CI; una ejecución manual con `DEPLOY` fuera de `main` falla explícitamente. El job de despliegue vuelve a comprobar la referencia y que el commit pertenezca a `main`. Empaca `dist`, `server.mjs` y `deploy/package.json`, despliega el ZIP en `gradex-front` y configura el inicio con `node server.mjs`. No se debe usar `vite preview` como servidor definitivo.

## Política de ramas y publicación

- `develop`: integración y pruebas. Nunca despliega.
- `release`: preparación y validación de la versión. Nunca despliega.
- `main`: única rama autorizada para publicar en producción. El despliegue es siempre manual: `workflow_dispatch` desde `main` con confirmación `DEPLOY`, después de que `Build and verify` haya pasado.
- `feature/**`: CI aislado. Nunca despliega.

El environment `production` debe configurarse con política de rama `main`, revisores obligatorios y, si el repositorio lo permite, impedir la autoaprobación. El workflow ya referencia ese environment; sin las reglas configuradas, la aprobación humana no se aplica. Al pasar a un environment, la credencial federada de Azure debe usar el sujeto `repo:Jessui630/GradeX-front:environment:production`; si la app registration solo tiene un sujeto de rama, `azure/login` fallará hasta que un administrador lo actualice. El job de despliegue solo acepta `workflow_dispatch` desde `main`; un `push`, `workflow_run` u otro evento no cumple la condición y no despliega. `.github/workflows/build.yml` es un flujo heredado de la rama `Sprint1`: solo ejecuta lint, pruebas, auditoría y build, no despliega.

Opciones de protección disponibles en un repositorio público como este:

- **Deployment branch policy**: permitir únicamente `main`.
- **Required reviewers**: hasta seis personas o equipos; la aprobación se solicita antes del job `deploy`.
- **Prevent self-review**: impedir que quien solicita la ejecución apruebe su propio despliegue, si la organización lo permite.
- **Wait timer**: retraso opcional antes de la aprobación.
- **Admin bypass**: deshabilitarlo cuando la política del repositorio lo permita.
- **Branch protection/ruleset de `main`**: PR obligatorio, revisiones y status checks de `Build and verify`/SonarCloud antes de fusionar.

La configuración actual del environment y de las ramas debe revisarse en GitHub; este repositorio no la modifica automáticamente.

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

El análisis automático **no importa cobertura**. `npm run test:coverage` genera un LCOV real en `coverage/lcov.info` y el CI lo publica como artefacto. La importación por CI está preparada pero **no activada**:

- Proyecto SonarCloud `Jessui630_GradeX-front`, organización `jessui630`, rama principal `develop`.
- `sonar-project.properties` define proyecto, organización, fuentes, pruebas y `sonar.javascript.lcov.reportPaths=coverage/lcov.info`.
- `.github/workflows/sonar.yml` es manual (`workflow_dispatch`), solo se ejecuta desde `develop` y exige confirmar que Automatic Analysis está desactivado.
- La autenticación usa `SonarSource/sonarqube-auth-action@v1`: intercambia el token OIDC de GitHub por una credencial temporal. **No se crea ni se almacena un secreto `SONAR_TOKEN`**; la acción entrega la credencial al paso del scanner.

Para activarla, un administrador del proyecto debe confirmar que Secretless Analysis está habilitado y el proyecto vinculado, desactivar Automatic Analysis en SonarCloud (Administration → Analysis Method), ejecutar el workflow manual desde `develop` con la confirmación marcada y verificar que el Quality Gate y las medidas de cobertura aparecen. El scanner debe sustituir al análisis automático, no ejecutarse en paralelo. Mientras Automatic Analysis siga activo, no se declara cobertura importada.

Los E2E usan `sqlcmd` contra `GradeX_IntegrationTests` para preparar roles, especialistas, criterios y un certificado no auténtico, y limpian solicitudes previas antes de ejecutarse. `sprint1-solicitante.spec.js` cubre el flujo base; `sprint2-sprint3.spec.js` cubre asignación, evaluación, evidencia adicional, certificado con QR, Mis certificados y perfil; `certificate-results.spec.js` verifica que un certificado con dictamen `NO_AUTENTICO` no se presente como auténtico. No se ejecutan en el CI hospedado porque requieren SQL Server LocalDB; se ejecutan localmente con `npm run test:e2e`.

El helper E2E usa una ruta absoluta de `sqlcmd` (o `SQLCMD_PATH`) y no resuelve el ejecutable por `PATH`.
