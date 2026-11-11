import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

// Un controlador activo significa que esta instalación reemplaza una versión
// anterior. En ese caso recargamos las pestañas para que no sigan mostrando
// el HTML precargado por el service worker antiguo.
const hadActiveWorker = Boolean(self.registration.active)

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

// Las navegaciones siempre intentan la red primero. El HTML nunca debe quedar
// atrapado en una precarga antigua; la copia en caché solo cubre fallos de red.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'gradex-paginas',
      networkTimeoutSeconds: 5,
    }),
    {
      denylist: [/^\/api(?:\/|$)/],
    },
  ),
)

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (!hadActiveWorker) return

      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: false,
      })

      // No esperamos la navegación: la petición necesita que la activación
      // termine, así que esperarla aquí bloquearía la recarga.
      for (const client of windows) {
        client.navigate(client.url).catch(() => {})
      }
    })(),
  )
})
