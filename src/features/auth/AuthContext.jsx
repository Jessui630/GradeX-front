import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import {
  cerrarSesion as cerrarSesionApi,
  iniciarSesion as iniciarSesionApi,
  obtenerSesionActual,
  registrarCuenta,
} from './auth.api'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorSesion, setErrorSesion] = useState(null)

  useEffect(() => {
    let activo = true

    obtenerSesionActual()
      .then((sesion) => {
        if (activo) setUsuario(sesion)
      })
      .catch((error) => {
        if (activo && error?.status !== 401) {
          setErrorSesion(error.message)
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const iniciarSesion = useCallback(async (datos) => {
    const sesion = await iniciarSesionApi(datos)
    setUsuario(sesion)
    setErrorSesion(null)
    return sesion
  }, [])

  const registrar = useCallback((datos) => registrarCuenta(datos), [])

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionApi()
    } finally {
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      errorSesion,
      iniciarSesion,
      registrar,
      cerrarSesion,
    }),
    [usuario, cargando, errorSesion, iniciarSesion, registrar, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
